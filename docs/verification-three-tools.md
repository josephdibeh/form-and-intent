# Three-tool companion verification

Date: 18 September 2026. Status: functional local prototype; public deployment and submission-quality acceptance remain pending.

## Target and scope

Three equally prominent tools share a conversation: brainstorm layouts, write UI copy, and summarize usability feedback. Generated proposals remain distinct from accepted work. Layout previews use registered components and semantic tokens; copy can target an exact component field; feedback quotes reference supplied notes.

Smallest change set: introduce a typed `/companion` API, shared artifact renderer, and conversational workspace while retaining the original checkout demo and its regression tests. No arbitrary generated code executes. Airtable, editable Figma export and autonomous tool use remain deferred.

## Verification completed

- Full automated suite: 101 tests passing across 10 files.
- Frontend production build and Storybook build into `dist/storybook`: passed.
- Production Worker dry run: passed; no upload performed.
- Built frontend and Worker bundle scan: no Gemini API-key pattern found.
- Browser: real layout generation, second-direction acceptance, actual token inspection, matching Storybook component, targeted copy generation/application, feedback synthesis, saved conversation and accepted revisions after reload.
- Responsive checks at 1440, 768 and 360 pixels. No horizontal document overflow at tablet/mobile; layout previews fit their containers. RTL layout preview also checked; English content is not translated.
- Independent implementation reviews led to fixes for stale targeted-copy application, accepted copy persistence/export, selected-direction context, multiple-summary overlap and split layouts without a summary.

## AI reliability and quality

The original ten-case synthetic run returned seven valid responses and three output-validation failures. Provider schema constraints were simplified while retaining full runtime validation. One bounded validation repair now handles malformed model artifacts; provider errors are not automatically retried. Server and client timeouts are bounded, and logs exclude prompt/response bodies and secrets.

The separate final run returned **9/10 valid responses**, with one provider-busy HTTP 503. Successful median latency was 9.095 seconds; maximum was 17.064 seconds. One missing-structure output was repaired successfully. Evidence: [final evaluation](evidence/layout-after-repair-evaluation.json), with response files linked per case. The original evaluation is preserved separately.

**Valid structure is not useful design.** Manual review found omitted fee breakdowns and eligibility details, unsupported payment timing, incorrect turnaround arithmetic, and informational facts represented as selectable choices. The PRD target of nine useful results out of ten is not established. Feedback quote matching verifies excerpts only, not model interpretations. Human design review remains necessary.

Next quality gate: preserve supplied facts and policy boundaries in both directions, enforce component semantics, then rerun the same synthetic cases and review usefulness separately from response validity.

## Public deployment gate

GitHub Pages can serve the built interface and Storybook; live Gemini requests require the separate Worker. The Pages workflow and proposed production Worker configuration are prepared. The Worker config currently permits localhost for the first hosted-backend test; the exact Pages origin must replace it before launch.

The Cloudflare plugin can access the selected account, `Josephdibeh@gmail.com's Account`. Automatic approval review rejected creation of `josephdibeh.workers.dev` because the exact account and hostname had not been confirmed. No Worker was uploaded and no model key was transferred. Proposed backend: `form-and-intent-api.josephdibeh.workers.dev`.

After exact approval: create the account subdomain, upload the Worker, configure the existing Gemini key as a server secret, verify live inference, then configure the GitHub repository/Pages endpoint and verify from the public origin. Keep billing disabled and no paid fallback. Free-tier availability and quota are not guaranteed; CORS and rate control are not authentication.

The prototype is not yet ready to submit as a public working link.

## Focused workspace update — 18 September

- Choosing a layout now commits a revision immediately and focuses that direction; Change direction restores comparison. Standalone copy focuses its chosen alternative with Change copy. Inspection does not choose a direction. Fresh generated layouts show both choices.
- Contextual next actions stage editable prompts without sending automatically. Write its copy targets an inspected field or the chosen heading; follow-up requests carry selected direction/copy metadata.
- Added native-modal system catalog with five shared component specimens, Storybook links and 29 resolved semantic token specimens. One real system is registered. Multi-system import/switching and system migration are not implemented.
- Improved service-card typography, spacing and focused canvas sizing. Focused rationale collapses to prioritize the design. This is a renderer improvement, not completion of the richer semantic component/pattern or structured-fact pipeline.
- Fresh verification: 105 tests pass; frontend and Storybook production builds pass. Browser verified catalog components/tokens, reversible direction choice, committed revision, reload and 360/1440px widths without horizontal overflow. No live model requests were necessary for these client-side changes; previous model-quality findings still apply.

## Base Web + Careem-inspired team system — 18 September

Approved integration replaces the preview foundation with actual Base Web 18.2 components while keeping Form & Intent's shell styling. Careem's public colors and functional Inter guidance supply the example brand theme. The UI/catalog label this as an independent demo, not Careem's internal library. Existing saved drafts are re-rendered through the new adapter; historical visual themes are not version-pinned.

Implementation: `team-system.ts` holds sourced reference values, 17 semantic roles, primitive mappings and model context; `TeamSection.tsx` renders Base Web typography, radio groups, cards and buttons. Catalog, inspector and Storybook share this renderer. Preview interactions are local simulations; no booking is submitted. Spacing/radii and semantic mappings are our demo decisions. Public source links and MIT/OFL notices are included.

Verification: 109 tests passing; app and Storybook production builds pass. Browser verified selectable radio cards, independent inspection, actual green CTA RGB(0,231,132), forest text RGB(0,73,62), Inter font, source links, desktop width1440 and narrow RTL width360 without horizontal overflow. Primary CTA contrast is tested >=4.5:1; this is not a full accessibility certification. One real synthetic Gemini request with the new system instruction returned two valid layout directions in 7.511 seconds (HTTP200).

Compatibility: Base Web Card uses a function default that React19 ignores; adapter explicitly supplies the exported hasThumbnail function. Companion-wide button styling was narrowed to exclude Base Web controls. npm reports old transitive peer/deprecation warnings; targeted runtime paths and builds pass, npm install audit reported zero vulnerabilities. Main frontend JS is ~159KB gzip; Vite warns about its >500KB uncompressed chunk. No public deployment. Prior factual-quality evaluation limitations still apply.

## 2026-09-19 — Focused conversations and clean preview

- Tool selection disappears after the conversation starts, including failed requests and restored conversations. New conversation returns to tool selection.
- Cross-tool next steps begin a fresh conversation with the selected artifact and direction as context; accepted revision records carry over. Same-tool refinements keep their conversation. This is not a multi-conversation archive.
- The workspace toolbar uses the artifact title. Removed the duplicated artifact header and acceptance-status row.
- Desktop/mobile controls change the same rendered artifact's available width, with mobile capped at 390px. No new generation or CSS scaling occurs.
- Recommendation, assumptions, rationale/tradeoffs and component tokens/Storybook links live in a collapsible right panel. Inspecting a component opens it; narrow workspaces use a drawer with Close and Escape.
- Browser checks on the existing synthetic home-cleaning result: at 1280px the mobile preview is 390px; desktop with docked details is 560px; document scroll width equals viewport. At 390px viewport the design fits at 358px and the details drawer remains inside the viewport; no horizontal page overflow. Restored default viewport and closed details.
- Regression suite: 111 tests passed. Production build passed, retaining the existing >500kB bundle warning. No provider or deployment changes and no new Gemini request in this verification.
- Airtable remains a proposed evidence-retrieval integration; no private records fetched or sent to Gemini.
