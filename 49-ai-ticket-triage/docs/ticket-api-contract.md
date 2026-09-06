# Ticket API contract

The reference workflow expects an authenticated ticket-system adapter. It can be implemented locally with any framework or mapped to an existing help-desk API.

## Authentication

Every call sends:

```http
Authorization: Bearer <TICKET_API_TOKEN>
Content-Type: application/json
Idempotency-Key: <event-and-action-specific-key>
```

The adapter must enforce a unique constraint on `Idempotency-Key` and return the original result for an exact replay. A conflicting payload using an existing key must return `409`.

## State endpoint

```http
POST /tickets/{ticketId}/state
```

Supported reference states:

- `NEEDS_REVIEW`
- `APPROVAL_REQUIRED`
- `REJECTED`
- `EXPIRED`

## Reply endpoint

```http
POST /tickets/{ticketId}/reply
```

The API must reject an empty `reply`. Safe-template replies keep the ticket `open`; only an exact human-approved draft may request `answered`.

## Operational requirements

- validate bearer tokens and ticket identifiers;
- enforce body-size limits and HTTPS in non-local deployments;
- store idempotency keys durably;
- return non-2xx for failed persistence or delivery;
- include a stable delivery or state-transition ID in successful responses;
- never treat retry exhaustion as a successful send.
