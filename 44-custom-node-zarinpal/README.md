n8n Custom Node: Zarinpal (Iranian Payment Gateway)

> Project 44 of the n8n Enterprise practice series
> A production-ready community node for the Zarinpal IPG v4 API, built from scratch with TypeScript

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Build the Node](#build-the-node)
- [Install into n8n](#install-into-n8n)
- [Configure Credentials](#configure-credentials)
- [Operations](#operations)
- [Zarinpal Error Codes](#zarinpal-error-codes)
- [Example Workflow](#example-workflow)
- [Troubleshooting](#troubleshooting)
- [Publishing to npm](#publishing-to-npm)

---

## Overview

This package implements a custom n8n node for **Zarinpal**, the most widely used Iranian payment gateway. Since no official n8n node exists for Zarinpal, this project demonstrates how to build, compile, and install a community node using the official n8n node SDK and TypeScript.

The node implements the full two-step Iranian payment flow:
1. **Request** — create a payment and receive an `Authority` code.
2. **Verify** — confirm the payment after the user returns from the bank.

---

## Features

- Three operations: Create Payment, Verify Payment, Get Unverified Payments
- Dedicated credential type with Merchant ID and environment selection
- Production and Sandbox (Zarin-Gate) environments
- Full Zarinpal v4 error code translation to human-readable messages
- `continueOnFail` support for resilient workflows
- Automatic StartPay redirect URL generation
- TypeScript with strict mode and compiled `dist` output

---

## Prerequisites

- Node.js 18+ and npm 9+
- A running n8n instance (self-hosted recommended for custom nodes)
- A Zarinpal Merchant ID (UUID format) from https://zarinpal.com
- TypeScript knowledge (for extending the node)

---

## Project Structure

```text
44-custom-node-zarinpal/
├── credentials/
│   └── ZarinpalApi.credentials.ts   # Credential definition (Merchant ID + env)
├── nodes/
│   └── Zarinpal/
│       ├── Zarinpal.node.ts         # Main node logic (execute method)
│       └── zarinpal.svg             # Node icon
├── package.json                     # npm metadata + n8n node registration
├── tsconfig.json                    # TypeScript compiler configuration
├── README.md                        # This file
├── .gitignore
└── .env.example
```

---

## Build the Node

### 1. Install dependencies

```bash
cd 44-custom-node-zarinpal
npm install
```

### 2. Compile TypeScript

```bash
npm run build
```

This compiles all `.ts` files into `dist/` and copies the SVG icon.

### 3. Development mode (auto-recompile)

```bash
npm run dev
```

---

## Install into n8n

### Method A: N8N_CUSTOM_EXTENSIONS (recommended for development)

Set the environment variable to point to your project folder, then restart n8n:

```bash
# Linux / macOS
export N8N_CUSTOM_EXTENSIONS=/full/path/to/44-custom-node-zarinpal

# Windows (PowerShell)
set N8N_CUSTOM_EXTENSIONS=E:\P\git project\n8n-workflows-practice\44-custom-node-zarinpal
```

### Method B: Install into the n8n custom nodes folder (persistent)

n8n loads community nodes from `~/.n8n/nodes/node_modules`.

```bash
# Linux / macOS
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes
npm install /full/path/to/44-custom-node-zarinpal

# Windows
mkdir %USERPROFILE%\.n8n\nodes
cd %USERPROFILE%\.n8n\nodes
npm install "E:\P\git project\n8n-workflows-practice\44-custom-node-zarinpal"
```

Restart n8n afterwards. The **Zarinpal** node will appear in the node search panel.

---

## Configure Credentials

1. In n8n, go to **Credentials** → **Add credential**.
2. Search for **Zarinpal API**.
3. Enter your **Merchant ID** (UUID format).
4. Select **Environment**:
   - `production` for real payments
   - `sandbox` for testing with the Zarin-Gate simulator
5. Save the credential.

---

## Operations

### 1. Create Payment

Sends a payment request to `POST /pg/v4/payment/request.json`.

| Parameter | Type | Required | Description |
|---|---|---|---|
| Amount (Toman) | number | yes | Payment amount in Toman (min 100) |
| Callback URL | string | yes | Redirect URL after payment |
| Description | string | no | Shown on the payment page |
| Return Start Pay URL | boolean | no | Adds `startPayUrl` to output |

**Output:** `authority`, `code`, `fee`, `expiryTime`, `startPayUrl`

### 2. Verify Payment

Confirms the payment via `POST /pg/v4/payment/verify.json`.

| Parameter | Type | Required | Description |
|---|---|---|---|
| Authority | string | yes | Authority from Create Payment |
| Amount (Toman) | number | yes | Must match the original amount |

**Output:** `verified`, `refId`, `code`, `cardPan`, `cardHash`, `fee`

### 3. Get Unverified Payments

Lists payments awaiting verification via `POST /pg/v4/payment/unverified.json`.

**Output:** `count`, `payments[]`

---

## Zarinpal Error Codes

The node translates Zarinpal error codes into readable messages:

| Code | Meaning |
|---|---|
| -9 | Validation error (merchant_id, amount, callback_url) |
| -10 | Merchant not found or inactive |
| -11 | Merchant inactive, contact support |
| -12 | Amount invalid or below minimum |
| -15 | Payment already verified |
| -16 | Payment unsuccessful |
| -22 | Payment not verifiable (canceled) |
| -30 | Amount mismatch with original request |
| -50 | Internal Zarinpal error |
| -54 | Payment archived |

---

## Example Workflow

A typical payment flow in n8n:

```text
Webhook (start payment)
   → Zarinpal [Create Payment]
   → Respond to Webhook (redirect user to startPayUrl)

Webhook (callback from bank)
   → Zarinpal [Verify Payment]
   → IF (verified == true)
        → True: Update order database / send receipt
        → False: Notify failure
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Node not visible in n8n | Verify build ran (`dist/` exists) and n8n was restarted |
| Credential not found | Ensure `npm run build` compiled the credentials file |
| Error -9 on request | Check Merchant ID format and callback URL validity |
| Error -30 on verify | Ensure verify amount equals the request amount |
| Icon not showing | Confirm `zarinpal.svg` was copied into `dist/nodes/Zarinpal/` |
| TypeScript errors | Run `npm install` again; ensure `n8n-workflow` is installed |

---

## Publishing to npm

To share this node with the community:

```bash
npm login
npm publish --access public
```

The package name must follow the convention `n8n-nodes-<name>` and include the keyword `n8n-community-node-package` (already configured).

Users can then install it via **Settings** → **Community Nodes** in n8n.

---

## Notes

- This project is for learning Enterprise n8n node development.
- Always test in the sandbox environment before going to production.
- Keep your Merchant ID secret; it is stored securely in n8n credentials.

---

Repository: https://github.com/kooroosh1363/n8n-workflows-practice
Author: kooroosh1363
Date: 2026