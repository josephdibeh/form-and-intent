# Form & Intent — lightweight PRD

**Status:** Product direction approved by Joseph on 18 September 2026; implementation underway. Three equally prominent tools are confirmed. This document defines the target; current verification and deployment limits are tracked in docs/verification-three-tools.md.

## Product promise

A conversational design companion with three equally prominent tools: brainstorm layouts, generate UI copy, and summarize usability feedback. Each works independently; a shared conversation connects insights to design improvements, grounded in an inspectable design system.

**Primary user:** A product designer exploring a screen, refining interface language, or making sense of usability notes.

**Job to be done:** “Help me understand my options, explain the tradeoffs, and turn the direction I choose into something I can inspect and refine.”

**Why this over a general chatbot:** The suggestions connect to a visual artifact, editable copy, real component definitions, and traceable design decisions. Joseph's curated knowledge can enrich those decisions later.

## What went wrong in the current prototype

We optimized component validation before establishing useful design tasks. The model can mostly toggle delivery emphasis, row density, and promo visibility on one existing checkout. Chat improved the shell, but this does not constitute meaningful layout brainstorming, a copywriting workflow, or feedback synthesis. Successful individual model calls did not establish a reliably accessible product.

Reuse the custom visual direction, renderer, tokens, inspector, Storybook, and validation where appropriate. Do not let the existing checkout dictate the product.

## Proposed MVP features

| Priority            | Capability                   | User input                                           | Required output                                                                                                    |
| ------------------- | ---------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| P0 — core           | Brainstorm layouts           | Screen goal, audience, required content, constraints | Two visibly different layout directions, wireframe previews, main tradeoffs, and a recommendation with assumptions |
| P0 — core           | Generate UI copy             | Selected element or named UI state, intent, tone     | Three contextual alternatives for a heading, CTA, helper, error, or empty state; compare and apply one             |
| P0 — core           | Summarize usability feedback | Pasted public/synthetic notes                        | Themes linked to source excerpts, observed problems, evidence limits, and three prioritized improvements           |
| P0                  | Conversational refinement    | Follow-up question, selected artifact/component      | Context-aware answer or proposal; no forced screen generation for ordinary questions                               |
| P0                  | Control the result           | Preview and accept a proposal                        | Before/after comparison, explicit apply, revision restore, and copy/download of the result                         |
| P1 — differentiator | Inspect the system           | Select a rendered component                          | Component identity, semantic tokens and actual values, usage guidance, and matching Storybook link                 |

**Confirmed by Joseph:** All three tools receive equal prominence. The starting experience offers three equally weighted actions with a sample input and clear expected output. Users can complete a copy or feedback task without first generating a layout. Each has an appropriate artifact view: layout comparison, copy alternatives, or evidence-linked feedback report. A shared conversation allows switching tools while retaining relevant context.

Implementation can proceed sequentially without changing product prominence: prove the hosted AI connection, then validate each tool independently and the transitions between them.

## Scope of layout generation

Recommended first domain: service-marketplace experiences. Initially support two declared screen families: service selection and order/booking review. Food ordering can be an example, not the whole product identity.

Layout options must differ in information hierarchy, grouping, or composition—not just spacing, labels, or emphasis. The component vocabulary must support those choices. Start with the smallest useful set of primitives/patterns for these two families; expand only when an approved scenario needs them.

For other screen types, provide a clearly labeled textual concept and explain that a component-backed preview is unavailable. Never silently turn every request into a checkout.

English first. Preserve existing RTL preview as a system capability; Arabic generation is optional draft content requiring review, not an MVP quality claim.

## Core journey

1. Choose one of three equally prominent tools: Brainstorm layouts, Write UI copy, or Summarize feedback. Provide one realistic sample for each.
2. The companion states its understanding and material assumptions; asks only necessary questions.
3. Results appear in the workspace as layout directions, copy alternatives, or an evidence-linked feedback summary.
4. The designer compares and chooses. Selecting content makes the next message contextual.
5. A proposed change updates the preview; acceptance records a revision. Questions leave the artifact unchanged.
6. Export the selected result with its rationale. System details remain available on demand.

Example: “People miss the final cost and keep asking when delivery arrives.” The companion distinguishes these reported observations from assumptions, proposes two ways to organize the review screen, suggests clearer total/delivery copy, and explains the tradeoff. The designer chooses a direction, inspects its components, and revises the CTA.

## UX and trust requirements

- Conversation left, artifact workspace center, contextual system details on demand. Small screens provide obvious navigation between chat and results.
- Always distinguish proposed, accepted, saved-example, and failed states.
- Show real request progress; never simulate agent work. A configured endpoint is not proof of a working connection.
- Errors explain the actionable cause where known: disconnected service, quota, busy provider, invalid proposal, or timeout. Retry preserves the conversation and artifact.
- Preserve the user's unsent draft, selected direction, and accepted revisions across refresh in the same browser; provide a clear reset.
- Feedback summaries quote only supplied notes; do not invent participants, frequency, severity, or findings. Separate observations, interpretations, and recommendations.
- Model rationale is judgment. Schema/token checks are verification. Neither alone establishes usability or accessibility compliance.

## AI and hosting boundary

Proposed public path: **GitHub Pages frontend → HTTPS Cloudflare Worker → Gemini free-tier API**.

GitHub Pages serves static frontend files; it cannot run the private Worker. Publishing the existing localhost configuration alone will not provide live AI to reviewers. Deploy the Worker separately, store the model key as a Cloudflare secret, configure the public endpoint and allowed origin, and test from another device with Joseph's local servers stopped.

Keep billing disabled and use free plans only. Quota exhaustion stops generation rather than enabling paid fallback. Free-tier availability is limited and may change; do not promise unlimited or always-on inference. Rate-limit public requests. A saved example may remain available, explicitly labeled, but cannot replace proof of live AI.

Retain a replaceable provider interface. If the free hosted path cannot meet the acceptance checks, evaluate a free alternative. Removing all model inference would change the submission into a prompt-based challenge, not fulfill this AI-prototype promise.

## Deferred

Airtable integration; editable Figma export; Figma library synchronization/Code Connect; autonomous multi-tool execution; arbitrary website generation; team accounts; collaborative editing; drag-and-drop canvas; production accessibility certification. Storybook is supporting evidence, not the headline feature.

## Acceptance before calling the MVP ready

- Public URL works from another device while all local development servers are off; no visitor API key/setup required.
- Ten unseen briefs across the two supported screen families: at least nine return usable, valid results; failures are visible and preserve state. Record actual latency and failures.
- Each successful layout request yields two structurally different directions with brief-specific tradeoffs. Joseph reviews usefulness, not just schema validity.
- Copy task returns three distinct, context-appropriate alternatives; applying one changes only the intended content.
- Feedback task links each theme to supplied notes and distinguishes evidence from recommendations; ambiguous/conflicting notes remain explicit.
- Follow-up, preview/apply, compare, restore, refresh persistence, and retry work without losing user work.
- Tokens and Storybook links match rendered components. No model credentials appear in public assets.

## Decisions for Joseph

1. **Decided:** Three equally prominent tools, each independently useful, sharing conversation context.
2. Recommended initial visual scope: service selection and order/booking review. Confirm or replace those two screen families before expanding the catalog.
3. Keep the no-cost Pages + Worker + Gemini setup only after a public reliability check. Model choice serves the product, not vice versa.

## Hosting sources checked

- [GitHub Pages is static hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Gemini free-tier pricing and data handling](https://ai.google.dev/gemini-api/docs/pricing)
