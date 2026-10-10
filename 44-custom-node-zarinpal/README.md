# 44 — n8n Custom Node for Zarinpal Payment Orchestration

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)
![Status](https://img.shields.io/badge/Status-Reference%20Implementation-0A7EA4)
![Language](https://img.shields.io/badge/TypeScript-Strict-3178C6)
![Platform](https://img.shields.io/badge/Platform-n8n-EA4B71)
![Domain](https://img.shields.io/badge/Domain-Payments-critical)

A TypeScript-based n8n community-node reference for integrating Zarinpal-style payment request, verification, and unverified-payment operations into automation workflows.

> **Scope:** this project demonstrates custom-node architecture, credentials, request construction, response mapping, and payment-flow orchestration. It should **not be treated as production-ready payment infrastructure in its current form**. The implementation contains several correctness and packaging issues that need to be resolved before real-money use.

## Why This Project Matters

Payment automation is fundamentally different from a normal API integration.

A reliable payment node must handle:

- exact amount semantics,
- callback authenticity,
- duplicate verification,
- retry safety,
- idempotency,
- provider response variations,
- auditable transaction state,
- environment separation,
- secure credential handling.

This project demonstrates the shape of a custom n8n payment node while keeping those trust boundaries explicit.

## Repository Layout

```text
44-custom-node-zarinpal/
├── .env.example
├── .gitignore
├── README.md
├── credentials/
│   └── ZarinpalApi.credentials.ts
├── nodes/
│   └── Zarinpal/
│       ├── Zarinpal.node.ts
│       └── zarinpal.svg
├── package-lock.json
├── package.json
└── tsconfig.json
```

## Current Operations

The node exposes three operations:

| Operation | Current implementation |
|---|---|
| Create Payment | POSTs merchant, amount, callback URL, and description |
| Verify Payment | POSTs merchant, authority, and amount |
| Get Unverified Payments | requests transactions awaiting verification |

The node supports two credential environments:

```text
production
sandbox
```

and switches the API base URL accordingly.

## Node Architecture

```text
n8n input item
     │
     ▼
Read operation + credential
     │
     ▼
Choose production / sandbox base URL
     │
     ├──────── Create Payment
     │              ↓
     │        payment request
     │              ↓
     │        authority / fee
     │
     ├──────── Verify Payment
     │              ↓
     │        verification request
     │              ↓
     │        refId / card metadata
     │
     └──────── Get Unverified
                    ↓
              payment list

Any thrown error
     ↓
continueOnFail?
  yes → { error: message }
  no  → fail execution
```

## Credential Model

The custom credential type stores:

- `merchantId`
- `environment`

The node reads the credential through:

```ts
const credentials = await this.getCredentials('zarinpalApi');
```

and never requires the Merchant ID as a visible node parameter.

That is the correct architectural direction for reusable n8n integrations: secrets/configuration belong in credentials rather than workflow JSON.

## Build

Install dependencies:

```bash
npm install
```

Compile TypeScript:

```bash
npm run build
```

The build script runs TypeScript compilation and then copies the SVG asset into `dist`.

Development watch mode:

```bash
npm run dev
```

### TypeScript configuration

The project currently enables:

```json
{
  "strict": true,
  "declaration": true,
  "sourceMap": true,
  "target": "es2019"
}
```

This is a good baseline for custom-node development.

## Critical Correctness Issue: `response.errors` Check

The implementation currently uses logic equivalent to:

```ts
if (response.errors) {
  throw new NodeOperationError(...);
}
```

In JavaScript, an empty array is truthy:

```js
Boolean([]) === true
```

Many APIs represent “no errors” as:

```json
{
  "errors": []
}
```

If the provider returns that shape, the current node can incorrectly treat a successful response as an error.

A safer check should validate whether an actual error exists, for example by checking:

- array length,
- an error code,
- or the documented error-object shape.

This should be fixed before evaluating the rest of the payment flow.

## Amount Unit Contract Is Ambiguous

The UI labels the field:

```text
Amount (Toman)
```

but the implementation sends the numeric value directly:

```ts
body: {
  merchant_id: merchantId,
  amount,
  ...
}
```

There is no conversion inside the node.

Therefore the real contract is currently:

```text
whatever number the user enters
→ sent unchanged to the provider
```

Before real-money use, the expected upstream currency unit must be verified against the current provider contract and encoded explicitly.

A payment node should never rely on an ambiguous UI label for money units.

A stronger design would expose a deterministic contract such as:

```text
input unit = canonical provider unit
```

or explicitly convert:

```text
application unit
→ provider unit
```

with automated tests.

## StartPay URL Behavior

When `returnStartPayUrl` is enabled, the current node returns both:

```text
startPayUrl
sandboxStartPayUrl
```

regardless of the selected credential environment.

That means a sandbox credential can still receive a production-looking URL field, and a production credential also receives a sandbox URL field.

A cleaner contract would expose one environment-aware field:

```json
{
  "paymentUrl": "..."
}
```

derived from the active environment.

This reduces the chance that a downstream workflow redirects a customer to the wrong payment environment.

## Verification Semantics Need Explicit Idempotency

The current verification result is calculated with:

```ts
verified: response.data.code === 100
```

Only one response code is treated as verified.

Payment callbacks can be retried by:

- a customer refreshing the callback page,
- application retry logic,
- reverse proxies,
- queue re-delivery,
- manual support operations.

The node should explicitly define how duplicate verification is represented and how downstream workflows should behave.

A production payment flow should distinguish:

```text
first successful verification
already verified / duplicate callback
failed payment
invalid authority
amount mismatch
provider/network uncertainty
```

and avoid granting the same order twice.

## Payment Success Must Not Depend Only on Browser Redirect

A safe checkout flow should not interpret a user returning to the callback URL as proof of payment.

Recommended orchestration:

```text
Create Payment
   ↓
persist order_id + amount + authority + status=PENDING
   ↓
redirect customer to payment page
   ↓
provider callback
   ↓
lookup original transaction
   ↓
verify authority + exact amount server-side
   ↓
atomic state transition
PENDING → PAID
   ↓
grant product/service once
```

The payment node is only one component of that state machine.

## Response-Schema Assumptions

The code accesses properties such as:

```text
response.data.authority
response.data.code
response.data.ref_id
response.data.card_pan
response.data.card_hash
response.data.fee
```

and for unverified payments assumes:

```ts
(response.data || []).map(...)
```

These are hard assumptions about the provider response shape.

There is no runtime schema validation before accessing them.

A production node should validate the response contract and raise a clear integration error when:

- `data` is missing,
- an expected array is nested differently,
- a numeric field changes type,
- a provider returns an HTTP error body with a different schema.

## HTTP Failure Handling

The node wraps provider requests in `try/catch` and supports n8n's `continueOnFail()`.

That is useful, but the current fallback output is only:

```json
{
  "error": "message"
}
```

This drops useful transaction context such as:

- input item index,
- operation,
- authority,
- amount,
- provider code,
- retriable vs. non-retriable classification.

A stronger failure object would preserve safe context:

```json
{
  "success": false,
  "operation": "verifyPayment",
  "providerCode": -30,
  "retriable": false,
  "message": "Amount mismatch"
}
```

without leaking sensitive data.

## Error-Code Mapping

The project includes a local error-code dictionary, which is useful for readable workflow output.

However, provider error contracts can evolve.

Treat the dictionary as:

```text
application-owned compatibility mapping
```

and maintain it with tests and provider-version review.

Unknown codes should preserve:

- raw code,
- provider message if available,
- operation,
- HTTP status.

They should not collapse into an opaque “Unknown error” if more evidence is available.

## Security Notes

Payment nodes should be treated as high-sensitivity integrations.

Recommended controls:

- store the Merchant ID only in n8n credentials,
- never log full payment/card data unnecessarily,
- validate callback input,
- use HTTPS callback URLs,
- separate sandbox and production credentials,
- restrict who can edit production payment workflows,
- retain auditable order/payment state outside transient execution output,
- avoid exposing provider response bodies containing sensitive metadata,
- use least-privilege infrastructure around n8n.

The current credential type does not define an explicit password-style mask on the Merchant ID. Whether the Merchant ID is considered secret or merely sensitive operational configuration, access should still be controlled.

## Missing Transaction Identity

The current node does not expose a first-class:

```text
order_id
transaction_id
idempotency_key
```

parameter for request creation.

A robust commerce workflow should associate every provider authority with an internal immutable order/payment identifier.

That mapping belongs in durable application storage.

Without it, reconciliation becomes harder when:

- callbacks are delayed,
- verification is retried,
- support staff investigate a payment,
- multiple attempts exist for one order.

## Validation Gaps

Current node parameters do not enforce all business constraints at runtime.

Examples that should be validated explicitly:

- amount is finite,
- amount is positive,
- amount follows provider minimum/maximum rules,
- callback URL is valid HTTPS where required,
- authority has expected shape,
- Merchant ID has expected format,
- description length fits provider constraints.

UI descriptions are not substitutes for runtime validation.

## Packaging Reality Check

### Empty icon asset

The repository currently contains:

```text
nodes/Zarinpal/zarinpal.svg
```

with a file size of **0 bytes**.

The build script copies that empty file into `dist`.

Therefore the README should not claim that the icon is fully configured until a valid SVG asset is added.

### No automated test script

`package.json` currently defines:

```text
build
dev
```

but no:

```text
test
lint
typecheck-only
```

script.

For a payment integration, this is a major gap.

At minimum, tests should cover:

- successful request,
- successful verification,
- duplicate verification,
- provider error payload,
- empty `errors` array,
- HTTP timeout,
- amount mismatch,
- sandbox URL selection,
- production URL selection,
- malformed response,
- `continueOnFail`.

### Dependency reproducibility

The package currently uses:

```json
"n8n-workflow": "*",
"n8n-core": "*"
```

Wildcard dependencies can make builds change over time without a source-code change.

A release-oriented community node should define a tested compatibility range and validate against supported n8n versions.

## License Metadata Mismatch

`package.json` currently declares:

```json
"license": "MIT"
```

while the previous README described the project as proprietary/internal.

Those are materially different licensing statements.

Before publishing or redistributing this package, choose one licensing model and make these files consistent:

- `package.json`,
- README,
- LICENSE file,
- repository-level policy.

The README should not make a contradictory legal claim.

## Environment Example Path

The current `.env.example` contains:

```text
N8N_CUSTOM_EXTENSIONS=E:\P\git project\n8n-workflows-practice\44-custom-node-zarinpal
```

but this project lives in:

```text
agentic-automation-lab
```

That path is an old/local development example and should not be copied literally.

Use an absolute path matching the actual local checkout.

## Development Installation

A generic development setup is:

```bash
npm install
npm run build
```

Then point your self-hosted n8n environment at the built custom extension using the deployment method supported by your n8n installation.

Avoid hard-coding one developer's machine path into production instructions.

## Example Payment Workflow

```text
Webhook / checkout request
       ↓
Load internal order
       ↓
Validate payable amount
       ↓
Zarinpal: Create Payment
       ↓
Persist authority + order mapping
       ↓
Respond with payment URL

Customer completes payment

Callback webhook
       ↓
Validate callback inputs
       ↓
Load PENDING payment by authority/order
       ↓
Zarinpal: Verify Payment
       ↓
Atomic idempotent state transition
       ↓
PAID?
 ├─ yes → fulfill exactly once
 └─ no  → retain failure/review state
```

## Testing Matrix

Before real-money use, test at least:

| Scenario | Expected behavior |
|---|---|
| valid sandbox request | authority returned |
| empty `errors: []` response | not treated as failure |
| provider validation error | structured failure |
| zero/negative amount | rejected before request |
| wrong amount on verify | no fulfillment |
| callback replay | no duplicate fulfillment |
| already-paid order | no second fulfillment |
| malformed response | integration error |
| provider timeout | retriable/unknown state |
| sandbox credential | sandbox payment URL only |
| production credential | production payment URL only |
| continue-on-fail enabled | context-preserving error item |
| unverified response shape changes | clear schema error |

## Production Hardening Roadmap

A production-oriented next version should add:

1. correct empty-error detection,
2. verified amount-unit contract,
3. environment-aware single payment URL,
4. runtime parameter validation,
5. typed provider-response validation,
6. idempotent callback/verification semantics,
7. internal order/payment identity support,
8. structured error taxonomy,
9. retry classification,
10. safer `continueOnFail` output,
11. integration tests with mocked provider responses,
12. sandbox end-to-end tests,
13. lint/typecheck/test scripts,
14. pinned/tested n8n dependency compatibility,
15. valid SVG node icon,
16. consistent license metadata,
17. CI build and test workflow,
18. release/versioning policy.

## Interview Defense

A concise technical explanation:

> This project demonstrates how to build an n8n community node in TypeScript with a dedicated credential type and multiple payment operations. I would not describe the current version as production-ready payment infrastructure because payment integrations require stronger guarantees than ordinary API nodes. The current code needs corrected error-shape handling, explicit amount semantics, environment-safe redirect URLs, response validation, idempotent verification behavior, and automated tests. The architectural goal is to keep the custom node focused on provider communication while durable order state and exactly-once fulfillment remain in the application workflow.

That framing is stronger than treating a successful API request as a complete payment system.

## License

The repository currently contains inconsistent license metadata: `package.json` declares MIT while the previous README used proprietary wording. Resolve that mismatch before publication or distribution.
