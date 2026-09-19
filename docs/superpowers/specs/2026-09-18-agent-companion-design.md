# Conversational design companion

Status: interaction direction authorized by Joseph; free hosted provider recommendation awaiting account availability. No live inference or public deployment is claimed.

## Target

A reviewer describes a design problem, receives two genuinely different, system-valid proposals, compares them in the live preview, accepts one, and refines a selected component. Each accepted revision can be restored. The first supported task remains a synthetic food-order summary.

## Hard constraints

- Zero paid services or automatic paid fallback. Use an account/project confirmed to be on a free plan; stop generation at provider limits. Account quotas and model availability must be checked before enabling live mode.
- Keep GitHub Pages as the frontend host. Provider credentials and future Airtable credentials belong only in server secrets.
- Preserve the existing token model, six React patterns, strict composition validator, custom visual direction, RTL preview, and integer price arithmetic.
- Preserve the last accepted composition on model failure, invalid output, cancellation, exhausted quota, or stale response.
- Public/synthetic context only for initial inference. Review data handling before sending any future Airtable records to a provider.

## Hosting recommendation

Gemini free-tier model through a Cloudflare Workers Free endpoint. Select the exact model from the actual account's free availability and evaluate it against our fixtures. Do not enable billing. Test Worker CPU usage against its free limit with the real validation workload.

Alternative: Groq Free through the same server boundary, subject to model/schema capability checks. Browser-local WebLLM removes hosted inference charges but introduces model downloads, WebGPU requirements, and device-dependent speed/quality. Prefer hosted inference for reviewer access if accounts and free quotas support it.

## Agent contract

Input: latest brief, accepted composition, selected block ID, bounded conversation history, catalog version, and requested mode (propose or refine).

Server owns the authoritative catalog, rules, schema, and synthetic evidence. Never accept client-supplied rules as authority. Model-proposed tool arguments and knowledge records are untrusted data.

Tools: inspect current composition; retrieve component definitions/rules; search curated UX evidence; validate candidate compositions. Tool calls are allowlisted, argument-validated, read-only except for returning proposed output, and bounded by a small maximum number of model/tool rounds. No arbitrary network access or generated code execution.

Response: clarify (one material question), propose (two alternatives for exploration, one focused candidate for refinement), or unsupported (explicit capability gap). Each proposal includes composition, concise tradeoff, affected component IDs, source/rule references, and deterministic check results supplied by code. No fabricated confidence scores or claims of universal usability quality.

A structural JSON schema verifies shape. Domain checks additionally preserve item IDs, quantities, prices, fees, and required content during visual refinement. Financial/content edits remain outside the first agent release. Alternatives must differ in at least one meaningful permitted composition property; superficial title changes do not count.

## Interaction

Desktop: conversation beside a generous preview. Component inspector appears on selection rather than occupying a permanent third column. Mobile: conversation and preview are explicit switchable views with draft/revision state preserved.

Show activity only for real events: retrieving rules, receiving candidates, validating output, ready to compare. Do not simulate tool activity or expose hidden model reasoning. Present concise decisions and evidence.

Candidates are drafts. Switching an option previews it without silently accepting it. Accept creates an immutable revision; restoring an older revision creates a new current revision. A response is tied to its originating revision; stale results cannot replace newer work. Editing a prompt during generation retains the newer draft.

Keep the preview interactive, Arabic/LTR controls, visible validation errors, cancellation, and JSON export. Label saved examples and imported content separately from live model results.

## Knowledge and future Airtable

Begin with checked-in synthetic records: ID, title, context, recommendation, evidence type, source, limitations, and relevant component/rule IDs. Retrieve a small relevant subset; include source IDs in output and reject unknown references. Keep recommendations distinct from enforced design-system rules.

Later add an Airtable adapter behind the same retrieval interface after reviewing the actual schema, permissions, publication rights, and provider data handling. No connector installation or database transmission is needed now. Adding a database improves available evidence; it does not automatically validate UX recommendations or train the model.

## Smallest implementation sequence

1. Define bounded agent messages, candidate/revision contracts, and context assembly; tests for invalid references, unchanged totals, distinct alternatives, and stale revisions.
2. Implement local server adapter and real model/tool loop; verify one delivery-emphasis refinement with an account-owned free API key stored outside source control.
3. Replace the brief/sidebar shell with conversation, candidate comparison, selection context, and revision restore. Reuse existing renderer and tokens.
4. Add synthetic evidence retrieval and traceable source references, leaving the Airtable adapter unconnected.
5. Verify live evaluation scenarios, free quota failure, responsive/RTL/keyboard behavior, then deploy frontend/backend and verify the public URL.

## Acceptance evidence

- Real model returns valid proposals for unseen briefs and explains task-specific tradeoffs.
- Delivery-emphasis refinement keeps all monetary data and required content unchanged.
- Unknown patterns produce an unsupported response or are rejected, never arbitrary markup.
- Two options meaningfully differ; preview/accept/restore behavior is predictable.
- Malformed output, rejected tool arguments, injection-like input, cancellation, quota failure, and stale requests preserve the accepted artifact and newer draft.
- Evidence links resolve to retrieved records; design judgment is not displayed as a machine-verified accessibility guarantee.
- Browser checks at 360, 768, 1024, and 1440 widths; Arabic and long copy; no new horizontal overflow.
- Public bundle contains no model or Airtable secrets. No live or deployment success claim without a tested round trip.

## Sources checked on 18 September 2026

- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/rate-limits
- https://developers.cloudflare.com/workers/platform/pricing/
- https://console.groq.com/docs/billing-faqs
- https://webllm.mlc.ai/docs/user/get_started.html
