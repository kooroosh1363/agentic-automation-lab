n8n Custom Node: Data Transformer

> Project 46 of the n8n Enterprise practice series
> A reusable community node for advanced data transformation, published to npm

---

## Table of Contents
- [Overview](#overview)
- [Operations](#operations)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Build the Node](#build-the-node)
- [Install into n8n](#install-into-n8n)
- [Publish to npm](#publish-to-npm)
- [Semantic Versioning](#semantic-versioning)
- [Troubleshooting](#troubleshooting)

---

## Overview

The **Data Transformer** is a generic, reusable n8n community node that performs advanced data transformations without writing custom code. It is designed for any workflow that needs to reshape JSON data: flattening nested objects, merging configurations, removing duplicates, grouping records, or selecting specific fields.

Unlike service-specific nodes, this node requires **no credentials** and works with any input data.

---

## Operations

### 1. Flatten

Converts nested JSON into flat dot-notation keys.

Input:
```json
{ "user": { "name": "Ali", "address": { "city": "Tehran" } } }
```
Output (separator `.`):
```json
{ "user.name": "Ali", "user.address.city": "Tehran" }
```

### 2. Deep Merge

Recursively merges all input items into a single object. Later items override earlier scalar values, but nested objects are merged deeply.

### 3. Deduplicate

Removes duplicate items based on a field value.

Input (field `id`): `[{id:1},{id:1},{id:2}]`
Output: `[{id:1},{id:2}]`

### 4. Group By

Groups items by a field value.

Output per group:
```json
{ "groupKey": "Tehran", "count": 3, "items": [ ... ] }
```

### 5. Select Fields

Keeps only (or removes) the listed comma-separated fields.

---

## Prerequisites

- Node.js 18+ and npm 9+
- A running n8n instance
- An npm account (for publishing) — https://www.npmjs.com/signup

---

## Project Structure

```text
46-custom-data-transformer/
├── nodes/
│   └── DataTransformer/
│       ├── DataTransformer.node.ts    # Node logic with recursive algorithms
│       └── datatransformer.svg        # Node icon
├── package.json                       # npm metadata + n8n registration
├── tsconfig.json                      # TypeScript compiler configuration
├── LICENSE.md                         # MIT license
├── README.md                          # This file
├── .gitignore
├── .npmignore                         # Files excluded from the npm package
└── .env.example
```

---

## Build the Node

```bash
cd 46-custom-data-transformer
npm install
npm run build
```

The compiled output is placed in `dist/` and the SVG icon is copied automatically.

---

## Install into n8n

### Method A: N8N_CUSTOM_EXTENSIONS (development)

```bash
set N8N_CUSTOM_EXTENSIONS=E:\P\git project\n8n-workflows-practice\46-custom-data-transformer
```

### Method B: Persistent install

```bash
mkdir %USERPROFILE%\.n8n\nodes
cd %USERPROFILE%\.n8n\nodes
npm install "E:\P\git project\n8n-workflows-practice\46-custom-data-transformer"
```

Restart n8n. The **Data Transformer** node appears under the Transform category.

---

## Publish to npm

### 1. Create an npm account

Sign up at https://www.npmjs.com/signup and verify your email.

### 2. Log in from the CLI

```bash
npm login
```

Enter your username, password, and OTP (if 2FA is enabled).

### 3. Verify the package name

The name must be unique on npm and follow the `n8n-nodes-*` convention. Check availability:

```bash
npm view n8n-nodes-data-transformer
```

If it returns an error (not found), the name is available.

### 4. Dry run (recommended)

Preview what will be published without actually publishing:

```bash
npm publish --dry-run
```

Confirm only `dist/`, `package.json`, `README.md`, and `LICENSE.md` are included.

### 5. Publish

```bash
npm publish --access public
```

### 6. Install from npm in n8n

After publishing, any n8n user can install it via:
- **Settings** → **Community Nodes** → search `n8n-nodes-data-transformer` → Install

Or via CLI:
```bash
cd ~/.n8n/nodes
npm install n8n-nodes-data-transformer
```

---

## Semantic Versioning

This project follows [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`):

| Change Type | Bump | Command |
|---|---|---|
| Bug fix | PATCH | `npm version patch` |
| New feature (backward compatible) | MINOR | `npm version minor` |
| Breaking change | MAJOR | `npm version major` |

After bumping, publish the new version:

```bash
npm version patch
git push && git push --tags
npm publish
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| `ENEEDAUTH` on publish | Run `npm login` first |
| Name already exists | Choose a unique `n8n-nodes-*` name |
| 403 on publish | Ensure `--access public` for scoped packages or check account permissions |
| 2FA prompt fails | Use an OTP from your authenticator app |
| Node not visible in n8n | Rebuild and restart n8n |
| `dist` missing on npm | Ensure `prepublishOnly` runs the build |

---

## Notes

- The node is credential-free and safe to install in any environment.
- Recursive algorithms handle arbitrarily deep nesting.
- Keep the package focused; add new operations as MINOR versions.

---

Repository: https://github.com/kooroosh1363/n8n-workflows-practice
Author: kooroosh1363
Date: 2026