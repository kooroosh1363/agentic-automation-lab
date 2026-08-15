# n8n Custom Node: GitHub Enterprise (Pagination + Rate Limiting)

![Level](https://img.shields.io/badge/Level-Production--oriented-198754)

> Project 47 of the n8n Enterprise practice series
> An enterprise-oriented n8n node with automatic pagination and exponential-backoff rate limiting

---

## Table of Contents
- [Overview](#overview)
- [Key Concepts](#key-concepts)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Build the Node](#build-the-node)
- [Install into n8n](#install-into-n8n)
- [Configure Credentials](#configure-credentials)
- [Parameters](#parameters)
- [Example Usage](#example-usage)
- [Troubleshooting](#troubleshooting)

---

## Overview

Real-world enterprise APIs impose two hard constraints:

1. **Pagination** — a single request returns only a limited number of records.
2. **Rate Limiting** — sending too many requests too fast results in HTTP 429 or temporary bans.

This node solves both. It automatically walks through every page of a GitHub (or GitHub Enterprise Server) endpoint and, when it hits a rate limit or a server error, it retries using **Exponential Backoff with Jitter** instead of failing.

---

## Key Concepts

### Exponential Backoff with Jitter

When a retryable error (429 or 5xx) occurs, the node waits before retrying. The wait time doubles on each attempt, plus random jitter to prevent many clients from retrying at the same instant (Thundering Herd).

| Attempt | Base Delay | With Jitter (approx) |
|---|---|---|
| 1 | 1s | 1.0 – 1.5s |
| 2 | 2s | 2.0 – 3.0s |
| 3 | 4s | 4.0 – 6.0s |
| 4 | 8s | 8.0 – 12.0s |
| 5 | 16s | 16.0 – 24.0s |

Maximum delay is capped at 32s.

### Rate-Limit Awareness

After each successful response the node reads:
- `X-RateLimit-Remaining` — if `0`, it sleeps until `X-RateLimit-Reset`.
- On error, it honors the `Retry-After` header if present.

### Circuit Breaker

If the node receives 3 consecutive failures, it stops retrying immediately to avoid wasting quota and to surface the problem quickly.

---

## Features

- Two pagination strategies: **Offset** (page number) and **Cursor** (next token)
- Automatic page walking with a configurable safety limit (`Max Pages`)
- Exponential backoff with jitter for 429 / 5xx errors
- Proactive rate-limit sleep using `X-RateLimit-*` headers
- `Retry-After` header support
- Circuit breaker after consecutive failures
- `continueOnFail` support for resilient workflows
- Works with GitHub.com and GitHub Enterprise Server (custom Base URL)

---

## Prerequisites

- Node.js 18+ and npm 9+
- A running n8n instance
- A GitHub Personal Access Token (PAT) with the required scopes

---

## Project Structure

```text
47-custom-node-pagination/
├── credentials/
│   └── GithubApi.credentials.ts        # PAT + Base URL credential
├── nodes/
│   └── GithubEnterprise/
│       ├── GithubEnterprise.node.ts    # Node with pagination + backoff
│       └── github.svg                  # Node icon
├── package.json
├── tsconfig.json
├── LICENSE.md
├── README.md                           # This file
├── .gitignore
├── .npmignore
└── .env.example
```

---

## Build the Node

```bash
cd 47-custom-node-pagination
npm install
npm run build
```

---

## Install into n8n

### Method A: N8N_CUSTOM_EXTENSIONS (development)

```bash
set N8N_CUSTOM_EXTENSIONS=E:\P\git project\agentic-automation-lab\47-custom-node-pagination
```

### Method B: Persistent install

```bash
mkdir %USERPROFILE%\.n8n\nodes
cd %USERPROFILE%\.n8n\nodes
npm install "E:\P\git project\agentic-automation-lab\47-custom-node-pagination"
```

Restart n8n afterwards.

---

## Configure Credentials

1. In n8n, go to **Credentials** → **Add credential**.
2. Search for **GitHub API**.
3. Enter your **Personal Access Token**.
4. Keep **Base URL** as `https://api.github.com` (or set your GHE server URL).
5. Save.

---

## Parameters

| Parameter | Type | Used In | Description |
|---|---|---|---|
| Operation | options | all | `List Items` or `Get Single Item` |
| Resource Path | string | all | Endpoint path, e.g. `/repos/owner/repo/issues` |
| Item ID | string | getItem | Resource identifier |
| Pagination Strategy | options | listItems | `offset` or `cursor` |
| Data Field | string | listItems | Field holding the array (empty if response is an array) |
| Cursor Field | string | listItems (cursor) | Field holding the next cursor token |
| Page Size | number | listItems | Items per page (GitHub max 100) |
| Max Pages | number | listItems | Safety limit to bound total requests |

---

## Example Usage

Fetch all issues from a repository (offset pagination):

```text
Manual Trigger
   → GitHub Enterprise
        Operation: List Items
        Resource Path: /repos/kooroosh1363/agentic-automation-lab/issues
        Pagination Strategy: offset
        Page Size: 100
        Max Pages: 10
```

The node returns one item per issue, having internally fetched every page while respecting rate limits.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| 401 Unauthorized | Check the PAT scopes and expiration |
| 403 rate limit exceeded | The node retries automatically; reduce Page Size or Max Pages |
| Too many requests | Lower Max Pages or increase spacing between workflow runs |
| Cursor pagination returns nothing | Verify the Cursor Field name matches the API response |
| Node not visible | Rebuild (`npm run build`) and restart n8n |
| Circuit breaker triggered | Investigate the underlying API error; 3 consecutive failures stop retries |

---

## Notes

- Always set a sensible `Max Pages` in production to bound cost and quota.
- For very large datasets, prefer cursor pagination where the API supports it.
- Combine with Project 46 (Data Transformer) to reshape the fetched data.

---

Repository: https://github.com/kooroosh1363/agentic-automation-lab
Author: kooroosh1363
Date: 2026
