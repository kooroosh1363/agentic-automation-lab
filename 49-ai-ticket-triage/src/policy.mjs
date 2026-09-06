import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const PRIORITIES = ['critical', 'high', 'normal', 'low'];
export const CATEGORIES = ['billing', 'technical', 'account', 'cancellation', 'security', 'other'];
export const SENTIMENTS = ['positive', 'neutral', 'negative'];

export function boundedString(value, maximum) {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}

export function safeEqual(leftValue, rightValue) {
  const left = Buffer.from(String(leftValue || ''), 'utf8');
  const right = Buffer.from(String(rightValue || ''), 'utf8');
  return left.length > 0 && left.length === right.length && timingSafeEqual(left, right);
}

export function redactForModel(value) {
  return String(value || '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[REDACTED_PAYMENT_NUMBER]')
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, '[REDACTED_PHONE]')
    .slice(0, 12000);
}

export function validateIntake(input, expectedSecret) {
  const body = input?.body && typeof input.body === 'object' ? input.body : input;
  const headers = input?.headers && typeof input.headers === 'object' ? input.headers : {};
  const suppliedSecret = headers['x-triage-secret'] || headers['X-Triage-Secret'] || '';
  const errors = [];

  if (!safeEqual(suppliedSecret, expectedSecret)) errors.push('unauthorized');

  const eventId = boundedString(body?.event_id, 120);
  const ticketId = boundedString(body?.ticket_id || body?.id, 80);
  const subject = boundedString(body?.subject, 300);
  const message = boundedString(body?.message || body?.body, 12000);
  const customerEmail = boundedString(body?.customer_email || body?.email, 320).toLowerCase();

  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(eventId)) errors.push('invalid_event_id');
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(ticketId)) errors.push('invalid_ticket_id');
  if (!subject) errors.push('missing_subject');
  if (!message) errors.push('missing_message');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) errors.push('invalid_customer_email');

  return {
    valid: errors.length === 0,
    validationErrors: errors,
    eventId: eventId || `rejected-${Date.now()}`,
    idempotencyKey: eventId || ticketId || `rejected-${Date.now()}`,
    ticketId: ticketId || 'unknown',
    subject,
    message,
    customerEmail,
    modelSubject: redactForModel(subject),
    modelMessage: redactForModel(message),
    receivedAt: new Date().toISOString(),
    state: errors.length ? 'REJECTED_INTAKE' : 'RECEIVED'
  };
}

export function classifyDecision(raw, ticket, threshold = 0.7) {
  let parsed;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    parsed = null;
  }

  const priorityValid = PRIORITIES.includes(parsed?.priority);
  const categoryValid = CATEGORIES.includes(parsed?.category);
  const sentimentValid = SENTIMENTS.includes(parsed?.sentiment);
  const numericConfidence = Number(parsed?.confidence);
  const confidenceValid = Number.isFinite(numericConfidence) && numericConfidence >= 0 && numericConfidence <= 1;
  const aiOutputValid = Boolean(parsed && priorityValid && categoryValid && sentimentValid && confidenceValid);
  const confidence = confidenceValid ? numericConfidence : 0;
  const priority = priorityValid ? parsed.priority : 'normal';
  const category = categoryValid ? parsed.category : 'other';
  const sentiment = sentimentValid ? parsed.sentiment : 'neutral';

  const text = `${ticket.subject || ''}\n${ticket.message || ''}`.toLowerCase();
  const sensitivePatterns = [
    /\b(?:2fa|mfa|password|credential|login|locked out|account recovery)\b/i,
    /\b(?:fraud|unauthori[sz]ed|breach|security incident|hacked|phishing)\b/i,
    /\b(?:refund|chargeback|payment|invoice|charged|credit card|bank account)\b/i,
    /\b(?:delete (?:my )?account|data deletion|gdpr|privacy request)\b/i,
    /\b(?:lawsuit|lawyer|legal action|regulator|compliance complaint)\b/i
  ];
  const patternRisk = sensitivePatterns.some((pattern) => pattern.test(text));
  const categoryRisk = ['billing', 'account', 'cancellation', 'security'].includes(category);
  const priorityRisk = ['critical', 'high'].includes(priority);
  const sentimentRisk = sentiment === 'negative';
  const riskReasons = [
    priorityRisk && `priority:${priority}`,
    categoryRisk && `category:${category}`,
    patternRisk && 'deterministic_keyword_policy',
    sentimentRisk && 'negative_sentiment'
  ].filter(Boolean);
  const sensitive = riskReasons.length > 0;

  let route = 'AUTO_TEMPLATE';
  const manualReasons = [];
  if (!aiOutputValid) manualReasons.push('invalid_ai_schema');
  if (confidence < threshold) manualReasons.push('below_confidence_threshold');
  if (manualReasons.length) route = 'MANUAL_REVIEW';
  else if (sensitive) route = 'APPROVAL_REQUIRED';

  return {
    ...ticket,
    priority,
    category,
    sentiment,
    confidence,
    confidenceThreshold: threshold,
    aiOutputValid,
    sensitive,
    riskReasons,
    manualReasons,
    route,
    state: 'TRIAGED',
    modelVersion: 'gpt-4o-mini',
    policyVersion: 'triage-policy-v2'
  };
}

export function buildSafeTemplate(ticket) {
  const templates = {
    technical: {
      subject: `Re: ${ticket.subject}`,
      body: `Thanks for contacting support about ticket ${ticket.ticketId}. We received the technical issue and kept the case open for review. If available, reply with the exact error message, the affected feature, and the approximate time the issue occurred. Please do not send passwords, payment details, or security codes.`
    },
    other: {
      subject: `Re: ${ticket.subject}`,
      body: `Thanks for contacting support about ticket ${ticket.ticketId}. We received your request and kept the case open. If any relevant details were omitted, you can reply to this message. Please do not include passwords, payment details, or security codes.`
    }
  };
  const draft = templates[ticket.category] || templates.other;
  return { ...ticket, draft, draftType: 'SAFE_TEMPLATE', state: 'AUTO_REPLY_READY' };
}

export function prepareApproval(ticket, draftInput, signingSecret, executionId, ttlHours = 4) {
  const draft = {
    subject: boundedString(draftInput?.subject || `Re: ${ticket.subject}`, 300),
    body: boundedString(draftInput?.body, 12000)
  };
  if (!draft.body) throw new Error('Generated draft body is empty');
  if (!signingSecret || signingSecret.length < 32) throw new Error('APPROVAL_SIGNING_SECRET must contain at least 32 characters');
  const canonicalDraft = JSON.stringify({ ticketId: ticket.ticketId, to: ticket.customerEmail, subject: draft.subject, body: draft.body });
  const draftHash = createHash('sha256').update(canonicalDraft, 'utf8').digest('hex');
  const approvalExpiresAt = new Date(Date.now() + Number(ttlHours) * 3600000).toISOString();
  const tokenPayload = `${executionId}:${ticket.ticketId}:${draftHash}:${approvalExpiresAt}`;
  const callbackToken = createHmac('sha256', signingSecret).update(tokenPayload, 'utf8').digest('hex');
  return {
    ...ticket,
    draft,
    canonicalDraft,
    draftHash,
    approvalExpiresAt,
    callbackToken,
    executionId,
    state: 'APPROVAL_REQUIRED'
  };
}

export function validateApproval(pending, body, signingSecret, now = new Date()) {
  const reviewer = boundedString(body?.reviewer, 160);
  const decision = String(body?.decision || '').toLowerCase();
  const suppliedHash = String(body?.draft_hash || '');
  const suppliedToken = String(body?.callback_token || '');
  const tokenPayload = `${pending.executionId}:${pending.ticketId}:${pending.draftHash}:${pending.approvalExpiresAt}`;
  const expectedToken = createHmac('sha256', signingSecret).update(tokenPayload, 'utf8').digest('hex');

  let state = 'REJECTED';
  let reason = boundedString(body?.reason, 500) || 'Reviewer rejected the draft';
  if (now >= new Date(pending.approvalExpiresAt)) {
    state = 'EXPIRED';
    reason = 'Approval window expired';
  } else if (!safeEqual(suppliedToken, expectedToken)) {
    reason = 'Invalid callback token';
  } else if (!safeEqual(suppliedHash, pending.draftHash)) {
    reason = 'Draft hash mismatch';
  } else if (!reviewer) {
    reason = 'Missing reviewer identity';
  } else if (decision === 'approved') {
    state = 'APPROVED';
    reason = boundedString(body?.reason, 500) || 'Draft approved by reviewer';
  } else if (decision !== 'rejected') {
    reason = 'Invalid decision';
  }

  return {
    ...pending,
    state,
    approvalReceipt: {
      eventType: 'approval_decision',
      ticketId: pending.ticketId,
      executionId: pending.executionId,
      draftHash: pending.draftHash,
      reviewer: reviewer || 'unverified-or-timeout',
      decision: state,
      reason,
      decidedAt: now.toISOString(),
      expiresAt: pending.approvalExpiresAt,
      policyVersion: pending.policyVersion
    }
  };
}
