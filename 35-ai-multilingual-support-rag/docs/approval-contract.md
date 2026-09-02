# Approval callback contract

The workflow sends a signed, execution-specific n8n resume URL to the private Slack review channel and then enters the `Wait for Approval` node. SMTP is unreachable until a valid approval callback is received.

## Request

Send an HTTP `POST` request to the resume URL shown in Slack:

```json
{
  "decision": "approved",
  "reviewer": "reviewer-identity",
  "draft_hash": "sha256-from-the-review-message",
  "reason": "optional reviewer note"
}
```

Allowed decisions are `approved` and `rejected`.

## Validation rules

An approval is accepted only when all of the following are true:

1. The callback arrives before `approvalExpiresAt`.
2. `decision` is exactly `approved`.
3. A non-empty reviewer identity is supplied.
4. `draft_hash` matches the canonical draft hash using a timing-safe comparison.

Changing the recipient, subject, body, closing, or ticket ID changes the canonical hash and invalidates the old approval. Rejected, malformed, mismatched, and expired callbacks take the no-send branch.

## Receipt

Every callback produces an audit event containing:

- ticket and n8n execution identifiers;
- canonical draft hash;
- reviewer identity and decision;
- decision reason;
- decision and expiry timestamps;
- evidence identifiers attached to the draft.

The approval receipt must be persisted successfully before the workflow can evaluate the SMTP branch.

## Identity boundary

The reference workflow assumes the one-time resume URL is delivered only to a restricted Slack review channel. The `reviewer` field is caller-provided and is therefore an asserted identity, not a cryptographically verified identity.

For production deployment, place the callback behind an authenticated approval application or use a verified Slack interactive-action callback. Derive the reviewer identity from the trusted identity provider or verified Slack payload instead of accepting a typed reviewer value.
