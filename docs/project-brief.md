# Design Companion — proposed project brief

Status: local implementation authorized. Visual direction: warm paper, ink, burnt orange, editorial typography, and inspectable components. Live AI hosting remains undecided. See README for verified implementation status.

## Target outcome

A public application where a reviewer enters a short food-order-summary brief, receives a working UI composition from an approved component catalog, inspects the reasons behind the composition, and requests a refinement. Joseph owns the repository, system definitions, prompts, and deployment configuration.

The product demonstrates constrained AI composition, semantic decisions, and bilingual layout behavior. It is a synthetic demonstration system, not Careem's actual design system.

## Recommended foundation

- React, TypeScript, and Vite for a static frontend deployed through GitHub Actions to GitHub Pages.
- Selected shadcn/ui source components, customized in the repository. Start with Button, Card, Input, Label, Badge, and Separator; add shell controls only when needed.
- Six AI-facing patterns: ScreenHeader, DeliveryDetails, OrderItems, PromoCode, PriceSummary, PrimaryAction. Their internal controls are implemented components, not arbitrary AI-generated markup.
- A small reference/semantic token set stored in JSON, with generated CSS variables. Add component-specific aliases only when a component has a distinct need.
- A versioned catalog describing pattern IDs, allowed properties, required content, purpose, restrictions, and bilingual behavior. Share it between generation, validation, and the in-app system inspector.
- Native browser APIs and local React state for the initial session; no account or persistent conversation service.

shadcn/ui provides the source-component foundation, not the complete governance model. The project's original work is the component contract, token semantics, validation, and co-design interaction.

## AI hosting decision

Recommended: GitHub Pages frontend plus a small serverless endpoint in Joseph's account. The endpoint stores the model credential as a secret, constructs the prompt from the approved catalog, and validates the model response. Add request-size/output limits, throttling, a spend ceiling or enforced quota, and a disable switch before exposing paid inference publicly. CORS alone does not prevent abuse.

Alternative: browser inference with WebLLM. This removes a hosted inference key but requires a model download and compatible device/browser, with performance and Arabic-output quality to be measured before choosing it for reviewers.

GitHub Pages hosting can be free with a public repository. Model inference is a separate cost/availability decision. A recorded example can remain usable during an outage, explicitly labeled as a saved example; it must never be presented as a live model response.

## System boundary

Brief + locale + current accepted composition + catalog version -> model -> structured JSON -> schema and policy validation -> approved React renderer.

The model chooses pattern order, permitted variants, and copy. It returns rationale linked to real pattern and rule IDs, plus unsupported requirements. It cannot supply executable code, arbitrary HTML, CSS, event handlers, or invented component/token IDs. Rationale is a model explanation; verified checks are reported separately.

The renderer owns token bindings. Where intent can vary, the model selects an allowed semantic role; code maps that role to the approved token. Identical raw color values do not make action and success roles interchangeable.

## First-release experience

1. Start with a short example brief or enter a custom brief within the declared order-summary scope.
2. Generate one layout with loading, cancellation, success, unsupported-request, and error states.
3. Inspect the preview, composition decisions, and named validation results.
4. Refine the current layout. Retain the last valid result if generation or validation fails; offer reset and one-step undo.
5. Switch the preview between English/LTR and Arabic/RTL. Initially use reviewed bilingual fixture copy for the reference scenario. Clearly identify generated copy that has not received language review.
6. Export the accepted composition as JSON with its catalog version.

Preview controls operate locally: promo-code validation and delivery-detail expansion can be simulated with labeled dummy behavior. The payment action must identify itself as a demo and never initiate a transaction.

## Layout and behavior constraints

- Desktop at 1024px and above: brief and controls alongside preview; decisions below or in an inspector tab. Below 1024px: single-column arrangement with accessible preview/decisions tabs where useful.
- Verify application widths of 360, 768, 1024, and 1440 CSS pixels. Verify generated mobile preview at 320 and 390 CSS pixels, clamped to available width.
- Use logical start/end spacing and direction-aware icons. Currency strings and mixed-language content must retain correct reading order.
- Long text wraps without clipping; interactive controls retain visible focus and meaningful labels. Use 44px minimum control target sizing as a project design rule.
- Reference tokens hold raw values; semantic tokens express purpose. AI-facing properties expose intent, not arbitrary visual values.
- One request may update the accepted composition at a time. Discard stale responses after cancellation/reset or a newer request.
- User inputs and model outputs are untrusted data. Render text as text and strictly validate response size, nesting, properties, and IDs.
- No blanket WCAG-compliance claim. Report the contrast, keyboard, labeling, and overflow checks actually performed.

## Delivery sequence and evidence

| Step                          | Smallest deliverable                                                                            | Why it exists                                                        | Verification before moving on                                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1. Define contracts           | Token JSON, catalog, composition schema, three synthetic briefs                                 | Gives the AI and renderer a shared language                          | Every pattern has valid properties and token bindings; unsupported IDs are rejected                                               |
| 2. Build a reference screen   | Static bilingual order-summary composition and approved renderer                                | Establishes what correct output looks like before adding variability | Inspect widths, long copy, keyboard behavior, contrast, and mixed-direction content                                               |
| 3. Connect generation         | One model adapter and validated generate/refine flow                                            | Makes the prototype truly AI-powered                                 | Run new briefs; reject malformed output and unsupported variants; retain last valid state on failure                              |
| 4. Make decisions inspectable | Rule-linked rationale, real validation results, undo, JSON export                               | Shows the design-system judgment behind the result                   | Export round-trip preserves the accepted layout and catalog version; explanations reference existing IDs                          |
| 5. Publish and package        | GitHub Pages workflow, backend configuration if selected, README, screenshots, 100-word summary | Makes the work accessible and understandable to reviewers            | Test the deployed repository subpath, reload, asset loading, live inference, error state, and absence of credentials in the build |

At every step: target -> constraints -> smallest change -> reason -> evidence. For visual mismatches, classify structure, sizing math, or overflow/positioning, change one group, then recheck. For AI mismatches, separately classify catalog/prompt ambiguity, invalid model output, or renderer defects.

## Evaluation scenarios

1. Standard brief: delivery details, items, promo code, total, and primary action render correctly.
2. Refinement: emphasize delivery instructions while retaining amounts and system rules; undo restores the previous composition.
3. Unsupported request: ask for an interactive map or arbitrary new styling; the companion explains the missing capability instead of inventing support.
4. Semantic collision: identical reference colors for primary action and success do not cause role interchange.
5. Arabic and stress content: long copy, Arabic text with Latin merchant names, and currency values remain readable without horizontal overflow.
6. Reliability: timeout, invalid JSON, obsolete catalog version, repeated clicks, cancellation, and quota exhaustion preserve a usable application.

## Scope and time boundary

Careem suggests 30–60 minutes. Treat that as a time-box for a narrow first proof, assuming credentials and deployment access are ready; measure actual effort. A polished public application with bilingual QA and backend safeguards may take longer. Document actual scope and effort honestly.

Defer multi-screen generation, drag-and-drop editing, accounts, team collaboration, arbitrary design-system imports, full Figma-library creation, MCP servers, and Code Connect until the core flow works and is verified. Free community Figma kits can help later, but their parity with the installed source components must be checked.

## Sources checked

- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- shadcn/ui source ownership: https://ui.shadcn.com/docs
- RTL setup: https://ui.shadcn.com/docs/rtl
- Community Figma kits: https://ui.shadcn.com/docs/figma
- Cloudflare Workers secrets: https://developers.cloudflare.com/workers/configuration/secrets/
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Browser inference alternative: https://webllm.mlc.ai/
