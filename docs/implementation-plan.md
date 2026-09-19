# Form & Intent implementation plan

Goal: a personal, inspectable design companion built from owned components and structured system rules.

Approved direction: warm off-white, ink, burnt orange, editorial typography, compact monospaced annotations. The visual shell and the generated UI are separate systems. GitHub Pages is the intended frontend host. Live AI hosting remains a user decision; no inference cost is authorized yet.

Architecture: typed component catalog -> strict composition validator -> React renderer. Live AI is behind a replaceable HTTP adapter; saved examples remain explicitly identified. Local state supplies selection, locale, undo, export, and simulated checkout controls.

Stack: React, TypeScript, Vite, Zod, Lucide, a shadcn-style Slot/CVA button primitive, custom CSS tokens, Vitest and Testing Library.

Spec: `docs/project-brief.md`.

## Checkpoints

- [x] Contract: `src/system/catalog.ts`, `tokens.json`, `contract.ts`, `examples.ts`; boundary tests reject invalid IDs, roles, props, oversized content, stale versions, and invalid rationale references.
- [x] Reference renderer: `src/components/Preview.tsx`, owned primitives, bilingual examples, locally simulated promo/action behavior. Verify truthful content, computed totals, direction, and selection.
- [x] Workspace: `src/App.tsx`, `src/styles.css`; saved examples, selection inspector, responsive composition, undo, reset, export. Tests exercise user-visible transitions.
- [x] AI seam: `src/ai/client.ts`; explicitly disabled without an endpoint; cancellation, strict parsing and stale-response protection when configured. No API key in the frontend.
- [x] Release preparation: reproducible build, Pages workflow, README with boundaries and local commands. Visually check 360/768/1024/1440 widths and Arabic at 320/390 preview widths.

Run `npm test` before the production implementation to establish missing behavior, then implement and re-run. Run `npm run build` after integration. Inspect actual browser output and correct one variable group at a time. Record the result and remaining gates in README and this checklist.

No external deployment, model-backed result, accessibility conformance, human Arabic review, or Code Connect integration may be claimed without corresponding evidence.

## Verified local milestone — 18 September 2026

- 21 automated tests passed across three suites; TypeScript and Vite production build passed.
- Browser checks covered desktop, tablet, and mobile layouts (360, 768, 1024, and 1440 CSS pixel targets), English/Arabic previews, dialog import, and 320-pixel long-copy overflow.
- Review fixes preserve newer draft text during inference, select imported component IDs correctly, allow emphasized delivery details to collapse, and wrap long unbroken copy. Variant-aware inspection reports the tokens actually used.
- The local preview server returned HTTP 200 and a fresh browser tab rendered the final workbench.

## Remaining gates

- [ ] Review the local art direction with Joseph.
- [ ] Decide live inference hosting and cost constraints; implement and verify one real model round trip.
- [ ] Create/push the public GitHub repository, enable Pages, and smoke-test the deployed URL.
- [ ] Human-review Arabic; prepare the final 100-word submission summary against the actual deployed functionality.
