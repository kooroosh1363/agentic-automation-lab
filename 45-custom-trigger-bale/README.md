 n8n Custom Trigger Node: Bale / Eitaa (Long-Polling)

> Project 45 of the n8n Enterprise practice series
> A polling trigger node for Iranian messengers Bale and Eitaa, built with the n8n TypeScript SDK

---

## Table of Contents
- [Overview](#overview)
- [How Long-Polling Works](#how-long-polling-works)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Build the Node](#build-the-node)
- [Install into n8n](#install-into-n8n)
- [Create a Bot and Configure Credentials](#create-a-bot-and-configure-credentials)
- [Event Filters](#event-filters)
- [Example Workflow](#example-workflow)
- [Troubleshooting](#troubleshooting)

---

## Overview

Iranian messengers **Bale** and **Eitaa** expose Bot APIs that are fully compatible with the Telegram Bot API. Since no official n8n node exists for them, this project implements a **polling trigger node** that continuously fetches new bot updates via `getUpdates` (long-polling) and starts an n8n execution for every incoming message or callback query.

Unlike a regular action node (Project 44), this node implements the `poll()` method and sets `polling: true`, making it a true **trigger** that starts workflows on its own.

---

## How Long-Polling Works

1. n8n calls the node's `poll()` method on a schedule.
2. The node calls `POST {baseUrl}/getUpdates` with:
   - `offset = lastUpdateId + 1` (never reprocess old updates)
   - `timeout = 25` (server holds the connection open up to 25s)
3. The server returns any new updates (or an empty array).
4. The node stores the highest `update_id` in **workflow static data**, so the offset survives restarts.
5. Filtered updates are emitted to start workflow executions.

Timeouts and connection resets are expected in long-polling and are handled gracefully (they return `null` instead of failing).

---

## Features

- Single node supporting both **Bale** and **Eitaa** platforms
- True trigger behavior via `poll()` and `polling: true`
- Persistent offset management using workflow static data (no duplicate messages)
- Event filtering: All Events / Messages Only / Callback Queries Only
- Graceful handling of long-polling timeouts (ETIMEDOUT, ECONNRESET, 409)
- Clean output schema: `updateId`, `eventType`, `chatId`, `text`, `raw`
- Secure bot token credential (password field)

---

## Prerequisites

- Node.js 18+ and npm 9+
- A self-hosted n8n instance
- A Bale bot token (from @BotFather in Bale) or an Eitaa bot token
- Basic TypeScript knowledge

---

## Project Structure

```text
45-custom-trigger-bale/
├── credentials/
│   └── BaleEitaaBot.credentials.ts        # Bot token + platform selection
├── nodes/
│   └── BaleEitaaTrigger/
│       ├── BaleEitaaTrigger.node.ts       # Trigger node with poll() method
│       └── baleeitaa.svg                  # Node icon
├── package.json                           # npm metadata + n8n registration
├── tsconfig.json                          # TypeScript compiler configuration
├── README.md                              # This file
├── .gitignore
└── .env.example
```

---

## Build the Node

```bash
cd 45-custom-trigger-bale
npm install
npm run build
```

The compiled output is placed in `dist/` and the SVG icon is copied automatically.

---

## Install into n8n

### Method A: N8N_CUSTOM_EXTENSIONS (development)

```bash
# Windows (PowerShell)
set N8N_CUSTOM_EXTENSIONS=E:\P\git project\n8n-workflows-practice\45-custom-trigger-bale
```

Restart n8n afterwards.

### Method B: Persistent install

```bash
# Windows
mkdir %USERPROFILE%\.n8n\nodes
cd %USERPROFILE%\.n8n\nodes
npm install "E:\P\git project\n8n-workflows-practice\45-custom-trigger-bale"

# Linux / macOS
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes
npm install /full/path/to/45-custom-trigger-bale
```

Restart n8n. The **Bale / Eitaa Trigger** node will appear under the Triggers category.

---

## Create a Bot and Configure Credentials

### Bale
1. Open Bale and message **@BotFather**.
2. Run `/newbot` and follow the steps.
3. Copy the bot token.

### Eitaa
1. Open Eitaa and use the official bot management (Eitaa Yar / botfather equivalent).
2. Create a bot and copy the token.

### In n8n
1. Go to **Credentials** → **Add credential**.
2. Search for **Bale / Eitaa Bot**.
3. Select the **Platform** (Bale or Eitaa).
4. Paste the **Bot Token**.
5. Save.

---

## Event Filters

| Filter | Triggers On |
|---|---|
| All Events | Messages and callback queries |
| Messages Only | Text/media messages from users |
| Callback Queries Only | Inline keyboard button presses |

---

## Example Workflow

```text
Bale / Eitaa Trigger (Messages Only)
   → IF (text contains "/start")
        → True: Send welcome message (HTTP Request to sendMessage)
        → False: Switch (command routing)
             → "/price": Reply with price list
             → "/support": Forward to support channel
             → default: Echo the message
```

To send a reply, use an HTTP Request node:

```text
POST https://tapi.bale.ai/bot<TOKEN>/sendMessage
Body: { "chat_id": {{ $json.chatId }}, "text": "Hello!" }
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| No executions triggered | Verify the bot token and that the workflow is **activated** |
| Duplicate messages | Ensure static data offset is working; do not run two instances of the same bot token |
| 409 Conflict error | Another long-poller is using the same token; stop it |
| Timeout errors in logs | Normal for long-polling; the node ignores them by design |
| Node not visible | Rebuild (`npm run build`) and restart n8n |
| Eitaa returns 404 | Confirm the Eitaa API base URL matches your bot provider |

---

## Notes

- Long-polling requires the n8n instance to have outbound internet access to the messenger API.
- For high-scale production bots, consider webhook mode instead of polling.
- Keep the bot token secret; it is stored encrypted in n8n credentials.

---

Repository: https://github.com/kooroosh1363/n8n-workflows-practice
Author: kooroosh1363
Date: 2026