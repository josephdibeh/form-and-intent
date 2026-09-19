# Three-tool companion implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement bounded tasks, with review before release.

**Goal:** Deliver three independently useful AI tools with a shared conversation and inspectable artifacts.
**Architecture:** A new typed /companion endpoint replaces checkout-only recipes in the primary UI. One React workspace manages conversation, draft proposals, accepted artifacts and browser persistence. Keep the existing checkout demo and tests as a legacy reference, not the product entry point.
**Tech Stack:** React, TypeScript, Zod, Vite, Cloudflare Worker, Gemini; existing semantic tokens and Storybook.
**Spec:** docs/light-prd.md (approved direction: three equally prominent tools).

## Global constraints

- Free plans, billing disabled; no paid fallback. Model key remains server-only.
- Three equal entry points; copy and feedback require no layout.
- Layout preview initially supports service selection and booking review. Other domains get a textual answer with an explicit preview limitation.
- Two structurally different directions, three contextual copy options, evidence-linked feedback with three prioritized improvements.
- No simulated progress or silent saved-example fallback.
- Preserve drafts, accepted revisions, result and conversation across reload. Bound storage and requests.
- Existing custom paper/ink/orange typography and tokens; responsive at 360, 768, 1440px.

## Task 1 — typed AI tools and reliable transport

Files: src/companion/contract.ts, src/companion/client.ts, server/companion.ts, server/worker.ts, tests/companion.test.ts.
Interface: Tool = 'layout' | 'copy' | 'feedback'; Request = {tool,brief,history,current?,selection?,sourceNotes?}; Reply = {message,artifact: Artifact|null}. Zod validates input and output. Artifact is discriminated by kind. Layout options render registered semantic section components; no generated HTML/code/URLs. Feedback quotes must match supplied source notes. Copy target references must match current layout.

- [x] Write failing tests for each artifact, unsupported/invalid output, fabricated quotes, origin handling, and upstream errors.
- [x] Add schemas, model system instruction and per-tool JSON schemas, preserving untrusted source boundaries.
- [x] Add bounded client transport; endpoint-origin-aware connection error; request timeout and cancellation.
- [x] Run unit tests and a real synthetic request for each tool; record results and limitations.

## Task 2 — artifact views and component inspection

Files: src/companion/ArtifactView.tsx, src/companion/catalog.ts, src/companion/Companion.stories.tsx, src/companion/artifacts.css.
Consumes Artifact contract from Task 1. Produces accessible ArtifactView with onSelect and onChoose callbacks and layout renderer shared with Storybook.

- [x] Render layout directions with visibly different composition, clear rationale/tradeoff, selected direction, and actual token/Storybook inspection.
- [x] Render contextual copy alternatives with choose action and feedback themes with verbatim excerpts, priorities, limitations.
- [x] Reuse semantic tokens, logical properties, keyboard focus, width constraints and existing RTL capability.
- [x] Validate rendered output and matching story IDs.

## Task 3 — conversational workspace and persistence

Files: src/companion/CompanionApp.tsx, src/companion/session.ts, src/companion/workspace.css, src/main.tsx, tests/companion-workspace.test.tsx.

- [x] Test equal entry points, independent copy/feedback requests, apply/restore, retry preserving unsent draft, and reload persistence.
- [x] Build compact brand rail, three equal tools, chronological chat, anchored composer and adjacent artifact.
- [x] Show sample briefs without sending automatically. Use real request state, cancellation, errors and retry.
- [x] Separate proposed and accepted state, retain bounded revision history, export JSON/text, reset session explicitly.
- [x] Switch main entry point and keep original App export for legacy tests.

## Task 4 — public path, verification and documentation

Files: wrangler config, .github/workflows/pages.yml, README.md, docs/light-prd.md, docs/verification-three-tools.md.

- [ ] Authenticate Cloudflare and verify free account; deploy separate Worker only with rate control, secrets and explicit origins.
- [ ] Configure public frontend endpoint and co-host Storybook under Pages; do not expose model keys.
- [x] Run full tests, production builds, responsive browser flows, live inference and independent review.
- [x] Record any external blockers honestly; no claim of public readiness without public evidence.

## Execution record

- Existing task-specific project on feat/design-companion, no commits; preserve existing untracked work. No additional worktree or blanket commit required.
- Baseline live /chat request returned HTTP 200 in 4.6s, but explicitly described checkout-only restrictions. Historical intermittent failure is not yet reproduced.
- Cloudflare plugin can read the selected account and Worker list; CLI OAuth is no longer required. Automatic approval review rejected creating the proposed account subdomain because the exact account and hostname were not confirmed. No Worker or secret was uploaded. Public deployment remains pending that explicit confirmation.
- Interface overlap: Task 1 contract feeds Task 2 renderer and Task 3 state; contract is frozen before integration. Worker changes owned solely by backend implementer. UI entry/state owned by root. Artifact views owned solely by renderer implementer.

- Local implementation and review are complete for the defined scope. Automated checks pass; the live evaluation does not establish the PRD usefulness target. See docs/verification-three-tools.md for remaining quality and deployment gates.
