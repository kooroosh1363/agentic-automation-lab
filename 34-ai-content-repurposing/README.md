# 34 — AI Content Repurposing & Multi-Platform Distribution (n8n)

![Level](https://img.shields.io/badge/Level-Advanced-6F42C1)
![Status](https://img.shields.io/badge/Status-Reference%20Workflow-0A7EA4)
![Orchestration](https://img.shields.io/badge/Orchestration-n8n-EA4B71)
![Integrations](https://img.shields.io/badge/Integrations-YouTube%20%7C%20OpenAI%20%7C%20WordPress%20%7C%20Notion%20%7C%20Slack-informational)

An n8n reference workflow that takes YouTube feed entries, attempts to obtain caption-related data, asks an LLM for five content formats, generates a thumbnail, creates a **WordPress draft**, creates a Notion calendar record, and sends Slack notifications.

> **Implementation status: reference / not production-ready.** The checked-in [workflow export](workflows/workflow.json) illustrates the intended integration pattern, but the YouTube captions request does **not** retrieve transcript text, the RSS read node is **not** a scheduled trigger, and the Slack message is a notification—not an approval gate. The exported graph also has fan-out/join risks described below. Do not activate it against real publishing accounts without fixing and testing these boundaries.

## Why this project matters

One source video can be repurposed into a blog article, short social copy, an Instagram caption, a newsletter summary, and creative direction for a thumbnail. The interesting engineering work is not just generation: it is **source provenance, reliable ingestion, review before publication, safe retries, and cross-platform consistency**.

### Current source files

| File | Purpose |
|---|---|
| `workflows/workflow.json` | n8n workflow export; eight nodes with integrations and placeholder credentials |
| `.env.example` | Example configuration names; **not** a secrets file |
| `screenshots/` | Workflow screenshots |
| `README.md` | This implementation-aware setup and limitations guide |

## Intended flow versus exported behavior

```text
YouTube channel feed
   |
RSS Feed Read (regular read node; needs a trigger)
   |
Extract Video Info (video ID, title, publication date)
   |
YouTube captions.list request (metadata, NOT caption transcript text)
   |
OpenAI content generation (JSON response requested)
   |----------------------|----------------------|
   v                      v                      v
DALL-E image           WordPress draft        Notion calendar record
   |                      |                      |
   +----> WordPress <-----+                      |
                         |                      |
                         +------> Slack <--------+
```

The diagram represents the **connections in the export**, not a verified reliable execution order. In particular, WordPress has two incoming paths (directly from content generation and from thumbnail generation), while Slack has two incoming paths (from WordPress and Notion). This is **not** an explicit wait-for-all/single-notification join; branches can execute separately, repeat work, or reference thumbnail data before it exists. Redesign and test the merge/gating behavior before activation.

### Node inventory (verified against `workflow.json`)

| Node | What it currently does |
|---|---|
| `RSS Feed Trigger` | Despite its name, its type is `rssFeedRead`; reads a configured YouTube RSS URL, not a timed trigger |
| `Extract Video Info` | Parses an 11-character video ID from the feed URL and composes metadata |
| `Fetch Video Transcript` | Calls the YouTube `captions?videoId=...&part=snippet` endpoint; does not fetch transcript text |
| `AI Generate Multi-Platform Content` | Requests JSON fields from GPT-4 |
| `Generate Thumbnail with DALL-E` | Requests a thumbnail using the generated `image_prompt` |
| `Publish to WordPress` | Creates a post with `status: draft`, not a published blog post |
| `Log to Notion Content Calendar` | Creates a record with `Status: Published` and `Platform: Multi-Channel` |
| `Notify Content Team on Slack` | Sends a message asking for review; does not wait for approval |

There are **no direct Twitter/X, LinkedIn, Instagram, or newsletter publishing nodes** in this export. Those formats are *generated copy*, not posted content.

## Generated content contract

The model is prompted to produce an object with the following keys:

```json
{
  "twitter_post": "Short post (requested maximum: 280 characters)",
  "linkedin_post": "Professional post",
  "instagram_caption": "Caption with hashtags",
  "newsletter_snippet": "Email-ready summary",
  "blog_article": "Long-form article",
  "image_prompt": "Thumbnail concept"
}
```

This is a **requested** response shape, not a validated schema. Several downstream node expressions call `JSON.parse(...message.content)` directly; invalid JSON, missing keys, unexpected response structures, or over-length outputs can fail execution. Add strict structural validation, content-length checks, and fail-closed routing before external side effects.

## Reproduce safely

### Prerequisites

- A compatible n8n installation able to import the `workflow.json` export. Exact runtime/node-version compatibility has **not** been verified here.
- Access to the services used by the workflow: OpenAI, YouTube, WordPress, Notion, and Slack.
- A **test** WordPress site, Notion database, and Slack channel. Avoid connecting production destinations during first runs.
- Review `.env.example` for the channel ID and Slack channel placeholders. Configuration syntax and availability depend on your n8n deployment.

### 1. Import and inspect

1. Import `workflows/workflow.json` in n8n as an **inactive** workflow.
2. Check that all eight nodes import without compatibility errors.
3. Open each credential selector. Replace placeholder IDs for OpenAI, WordPress, Notion, and Slack using n8n's credential manager.
4. Verify the environment references used by the nodes: `YOUTUBE_CHANNEL_ID`, `YOUTUBE_API_KEY`, and `SLACK_CONTENT_TEAM_CHANNEL`. Do **not** commit actual secret values to Git.
5. Keep all external-writing nodes disconnected or disabled during the first test.

### 2. Correct ingestion and transcript acquisition

- Add an actual Schedule Trigger (or a supported RSS trigger) if periodic runs are wanted; a read node alone does not schedule itself.
- Test with a known YouTube feed entry and inspect `videoId`, `title`, `publishedAt`, and `videoUrl`.
- The existing request to YouTube `captions.list` lists available caption tracks; it does not return caption text in `items[0].snippet.text`. The configured `Authorization: Bearer` header currently contains a value sourced from `YOUTUBE_API_KEY`, which is not an OAuth access token. Choose an authorized transcript acquisition method, supply the appropriate credentials and rights, and verify it returns **actual text**.
- Stop when captions are unavailable, empty, private, or unauthorized; do not silently invent a transcript or treat the video's title as a transcript.

### 3. Test generation without publishing

Use one authorized, short *sample transcript* and expected metadata in an isolated test branch of the workflow. Run only the content-generation node and inspect the raw response. Validate all required keys and length limits before enabling thumbnail generation or destination writes. Check factual claims against the transcript and have a human review externally visible copy.

### 4. Connect destinations one at a time

1. Configure a **test** WordPress site. Confirm the created post remains a **draft**.
2. Configure Notion to match the actual property names/types sent by the node. Its current `Published` status conflicts with the WordPress draft and its `Multi-Channel` platform value may not match a multi-select schema. Change the workflow/schema together before relying on statuses.
3. Configure a private Slack channel; confirm a *single* expected notification, not one per incoming branch.
4. Redesign the fan-out and join explicitly so the thumbnail and validated copy exist before WordPress, and delivery results are aggregated before notification.
5. Add an actual **approve/reject** gate before final publication, with a human identity and durable audit record; a Slack message alone cannot approve anything.

Only then consider scheduled runs, using a small canary feed and monitored credentials.

## Validation checklist

This is a **manual acceptance plan**, not a report of tests that have passed.

| Scenario | Expected result |
|---|---|
| Known feed entry with a valid video ID | Correct ID and title, exactly one processed input |
| Malformed or missing video link | Safe skip with an observable reason |
| No accessible caption text | No invented transcript and no external post |
| API key presented where OAuth is required | Explicit authentication failure and useful diagnostic |
| Invalid or incomplete model JSON | Halt before creating WordPress/Notion data |
| Image generation fails | No inconsistent downstream reference to missing image |
| WordPress draft succeeds, Notion fails | Visible partial-failure status and safe retry path |
| Multiple branch arrivals | One logical content job, one consolidated Slack notification |
| Duplicate RSS item or manual retry | No duplicate WordPress drafts or Notion records |
| Rejected / unreviewed content | Never automatically published |

For idempotency, a candidate key is the source video ID plus the content-policy/version identifier. Persist execution state and destination IDs before implementing retries. Also add bounded timeouts, rate-limit handling, and explicit operator reconciliation.

## Operational and security gaps

| Area | Current state / required next step |
|---|---|
| Scheduling | No actual trigger; add one |
| Transcript | Caption-track metadata is mistaken for transcript text; implement authorized text retrieval |
| Fan-out/join | Parallel paths are not synchronized; prevent duplicate writes and premature reads |
| Review | Slack is notification only; implement enforceable approval before public release |
| Publishing | WordPress is draft-only; no native publishing for the other social channels |
| Data consistency | Notion says `Published` while WordPress remains draft |
| Reliability | No documented durable retry state, deduplication, or partial-failure reconciliation |
| Data quality | No schema validation or factuality review of LLM output |
| Privacy and rights | Ensure permission to process transcripts and publish source-derived content; avoid leaking personal data |
| Secrets | Use n8n credentials or approved secret management; never copy real tokens into exports, examples, logs, or commits |
| Verification | No end-to-end run or production-readiness evidence is supplied by this README |

## Troubleshooting

- **No automatic executions:** `RSS Feed Trigger` is a regular RSS reader; connect a real trigger.
- **Transcript missing or undefined:** the captions listing response is not a transcript. Check authorization and use an approved text retrieval flow.
- **OpenAI JSON parse error:** inspect the actual output shape, validate before parsing, and route invalid output to a safe review state.
- **Duplicate WordPress or Slack actions:** investigate the multi-incoming connections and add deterministic joins/idempotency.
- **Featured image not attached:** WordPress may require a separate media upload and a media ID rather than a temporary external URL.
- **Notion property error:** verify exact database property types and the selected value options.
- **Unexpected cost or quota exhaustion:** use a test feed, limit items, and monitor YouTube/OpenAI/destination-service quotas.

## Safe next milestone

Make a **single-video, human-reviewed, draft-only** path reliable first: trigger → authorized transcript retrieval → validated AI JSON → optional thumbnail → WordPress draft + Notion draft status → consolidated Slack review notification. Prove empty/error/duplicate/retry cases before enabling any automated public posting.

## License and usage

This repository describes a portfolio/reference workflow. Check repository-level licensing and third-party API terms before redistribution or commercial deployment. No production deployment, rights clearance, or service-level guarantee is implied.
