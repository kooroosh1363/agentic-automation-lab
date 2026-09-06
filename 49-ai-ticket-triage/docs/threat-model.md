# Threat model

## Assets

- customer contact and ticket content;
- ability to change ticket state or send a customer reply;
- reviewer approval authority;
- provider, Slack, ticket API, and audit credentials;
- decision and delivery receipts.

## Trust boundaries

1. Internet caller to n8n webhook.
2. n8n to LLM provider.
3. n8n to ticket API.
4. n8n to audit sink.
5. n8n to restricted Slack review channel.
6. Reviewer callback to the n8n resume endpoint.

## Threats and mitigations

| Threat | Reference mitigation | Remaining deployment work |
|---|---|---|
| Forged ticket | Shared-secret header and strict input contract | TLS, gateway rate limits, secret rotation, optional source HMAC |
| Duplicate event | Required event ID and action-specific idempotency key | Production database unique constraint |
| Prompt injection | Untrusted-data prompt and deterministic downstream policy | Adversarial evaluation and organization-specific content controls |
| Model schema confusion | Full enum/range validation | Provider-specific structured-output enforcement |
| Sensitive case mislabeled safe | Independent keyword/category/priority/sentiment rules | Policy ownership, multilingual rules, continuous evaluation |
| PII exposure | Common-pattern redaction and minimized audit payload | DLP, regional processing, retention and access policy |
| Approval tampering | Canonical SHA-256 hash and HMAC token | Verified reviewer identity and secure approval UI |
| Approval replay | Expiring execution-specific n8n resume URL | Central nonce store if callback is proxied outside n8n |
| Empty or duplicate delivery | Body validation and idempotency | Provider delivery receipt and reconciliation job |
| Alert outage | Durable audit receipt precedes Slack | Secondary paging route and SLO monitoring |
| Secret in error message | Token/email redaction and length bound | Central secret scanning and structured provider errors |
| Audit modification | Linked SHA-256 records | Write-once remote backup and independent verification |

## Out of scope for the reference

- multi-tenant authorization;
- regulatory certification;
- complete PII discovery;
- identity-provider integration;
- vendor-specific ticket-delivery semantics;
- guaranteed LLM accuracy or calibrated confidence.
