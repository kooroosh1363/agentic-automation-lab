# Approval callback contract

The workflow sends the pending draft and an execution-specific n8n resume URL to a restricted Slack review channel. The customer-delivery node is unreachable until the callback passes every validation rule below.

## Request

POST this body to the resume URL shown in the review message:

```json
{
  "decision": "approved",
  "reviewer": "reviewer-identity",
  "draft_hash": "sha256-from-review-message",
  "callback_token": "hmac-token-from-review-message",
  "reason": "optional reviewer note"
}
```

`decision` must be `approved` or `rejected`.

## Enforced rules

Approval succeeds only when:

1. the Wait node has not exceeded `APPROVAL_TTL_HOURS`;
2. the HMAC callback token matches the execution, ticket, exact draft hash, and expiry;
3. `draft_hash` matches the canonical recipient, subject, body, and ticket ID using a timing-safe comparison;
4. a non-empty reviewer identity is supplied;
5. the decision is exactly `approved`.

Changing any protected draft field invalidates the previous hash and token. Rejected, malformed, mismatched, and expired callbacks reach the no-send branch. The n8n resume URL is execution-specific and single-use, which is also the replay boundary.

## Receipt

The decision receipt is persisted before the approval branch can be evaluated. It contains ticket and execution IDs, draft hash, reviewer, decision, reason, policy version, and decision/expiry timestamps. Raw ticket content and the callback token are excluded.

## Identity boundary

The HMAC proves that the callback carries the capability issued by this workflow. It does not prove the human identity typed into `reviewer`. Restrict the review channel for this reference deployment. For a live organization, put the resume callback behind an authenticated approval UI or a verified Slack interactive action and derive reviewer identity from SSO or the verified Slack payload.
