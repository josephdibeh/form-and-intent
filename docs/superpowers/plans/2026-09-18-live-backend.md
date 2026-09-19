# Live backend implementation plan

Goal: verify one real model-backed composition through a private local Worker before the conversational UI upgrade.
Spec: ../specs/2026-09-18-agent-companion-design.md

- Add server/worker.ts sharing the existing catalog, prompt, and composition validator. Accept only bounded POST /generate JSON from configured origins. Secrets are server-only. Disable inference by default; local enablement requires confirmed free tier. Preserve order items and fees during refinement.
- Add tests/worker.test.ts: missing configuration, invalid request, upstream quota failure, invalid composition, changed prices, and valid composition. Use injected transport for deterministic provider failures.
- Configure Wrangler local development and backend type checking. No public deployment in this step. Public enablement additionally requires rate-limit binding.
- Run tests and frontend build, then a live synthetic delivery-emphasis refinement. Only enable the local frontend endpoint after a validated response. Preserve the existing manual flow if the provider is blocked.
- Document actual evidence and outstanding conversational features separately from backend readiness.

## Evidence

- User confirmed Free tier / billing disabled. Key presence and authentication verified without exposing it.
- Gemini 2.5 Flash listed but generation rejected new accounts; Gemini 3.6 Flash returned high demand. Gemini 3.1 Flash-Lite returned HTTP 200 for a synthetic delivery-emphasis refinement. The server validated the composition and preserved item data and fees.
- Review identified a UTF-8 body-size mismatch; increased request envelope capacity and bounded returned JSON to the client limit. Added a large bilingual refinement regression.
- No public backend deployed; no secrets committed.

- Browser end-to-end: Generate produced a live validated emphasis variant with QAR 74.00 unchanged; Undo restored the default variant and saved-example provenance.
- 29 automated tests passed; TypeScript/Vite build passed. Credential scan found no saved key in the frontend build.

## Conversational correction requested by Joseph

Replace the static brief panel with chronological chat, an anchored composer, selection context, visible errors/retry, candidate cards, explicit acceptance, and restorable revisions. Preserve renderer, tokens, bilingual preview, export/import, and saved examples under secondary controls. Add a chat response contract allowing questions/explanations without a layout, or one/two validated proposals. Pass bounded history and selected ID. Retain protected order data and report specific validation failures. Add real component reference inspection; do not label an internal reference Storybook or promise Figma clipboard compatibility. Verify chat, failed retry, proposal preview/accept, selection context, and revision restoration in tests and browser.

## Conversational milestone evidence

- Live full-composition alternatives reproduced protected-order-data rejection. `/chat` now uses schema-constrained layout recipes; the server materializes components from current order data, eliminating model rewriting of protected values.
- Browser: two actual Gemini alternatives, preview, explicit acceptance, selected DeliveryDetails follow-up answered without changing the layout, and matched Storybook delivery-emphasis story rendered.
- 41 automated tests passed, including preserved drafts on retry, stale draft dismissal, removed-selection context, answer-only replies, duplicate alternatives, and immutable order-data recipes.
- Responsive checks: 1440 desktop, 768 tablet with inspector below, 360 mobile with anchored composer and no page horizontal overflow. Arabic preview reported rtl with no horizontal overflow at 360.
- App and Storybook production builds passed. Figma export, Airtable, autonomous tool execution, general screen types, durable chat history, and public deployment remain outstanding.
