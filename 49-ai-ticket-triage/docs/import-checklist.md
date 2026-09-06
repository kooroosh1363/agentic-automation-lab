# n8n import and activation checklist

1. Run `npm test` with Node.js 20 or later.
2. Import `workflows/triage-error-handler.json` and activate it.
3. Import `workflows/ai-ticket-triage.json`.
4. In the main workflow settings, select **49-Triage-Error-Handler** as the error workflow. n8n assigns workflow IDs during import, so a portable JSON export cannot safely hardcode this ID.
5. Expose every variable in `.env.example` to the n8n runtime. Use independent random values for webhook, approval, ticket API, and audit secrets.
6. Set `NODE_FUNCTION_ALLOW_BUILTIN=crypto` for self-hosted n8n Code nodes.
7. Start the local audit sink with `npm run audit:start` and verify `GET /health` from the n8n network.
8. Configure the ticket adapter according to `ticket-api-contract.md`.
9. Restrict the Slack webhook to a private reviewer channel.
10. Activate the main workflow and send the sample ticket with the `X-Triage-Secret` header.
11. Verify all four routes before any live integration: rejected intake, manual review, safe template, and signed approval.

Do not claim the imported workflow is operational until step 4 is completed and an intentional failure produces both an audit receipt and Slack alert.
