# Form & Intent

A conversational design companion by Joseph Dibeh, built for the Careem design challenge. Three equally prominent tools: brainstorm layouts, write UI copy, and summarize usability feedback.

## What works locally

- Six synthetic quick messages fill editable drafts, two per tool.
- Server-side neutral design guidance selects up to three relevant principles; protected source details are screened before provider calls and before results return.
- Real Gemini generation through a locally running Cloudflare Worker API; the key stays server-side.
- Two component-backed layout directions for service selection and booking review, with rationale, tradeoffs and assumptions.
- Three copy alternatives, independently or for a selected component. Applying contextual copy changes only its target field.
- Feedback themes with exact source excerpts, linked recommendations, and evidence limitations. Feedback also accepts PNG/JPG/WebP screenshots (up to 10 MB): previews are resized locally to 1600 pixels, sent inline only on submission, and are never stored by the app. Visual audits return located observations and one to three evidence-linked improvements; they cannot establish tested behavior or accessibility compliance.
- Each opening or reload starts a new conversation. Drafts, accepted choices and up to 12 revisions remain available during the current conversation. Results can be copied as text or downloaded as JSON.
- Component inspection exposes actual semantic token values and matching Storybook examples. The العربية control translates layout content through Gemini and applies RTL; English restores the original. Translations preserve structure and numeric values, are cached for that exact result, and are used by copy/download while displayed.

See [the PRD](docs/light-prd.md) and [verification record](docs/verification-three-tools.md) for scope and evidence. This is a bounded AI prototype, not an autonomous tool-calling agent or a production usability evaluator.

## Run locally

Requires Node 22.12+. Install with `npm ci`. Copy `.dev.vars.example` to `.dev.vars` and enter the Gemini key there; never put a model key in a `VITE_` variable. Keep Gemini billing disabled for the no-cost constraint.

The companion also requires `DESIGN_GUIDANCE_JSON` and `SOURCE_GUARD_TERMS` in `.dev.vars` (compact JSON values). The strict pack format is defined in `server/guidance.ts`; use only reviewed neutral entries from `docs/design-guidance-review.md`. The guard is a JSON array of protected names and aliases. Both are private runtime configuration: keep them out of `VITE_` variables, Git and public build artifacts. Missing or invalid configuration deliberately disables generation. Never put raw source records in either the model context or the frontend.

Create `.env.local`:

```dotenv
VITE_AI_ENDPOINT=http://127.0.0.1:8787/companion
VITE_STORYBOOK_URL=http://127.0.0.1:6008
```

Start all three services from an unused set of ports:

```sh
npm run dev:all
```

The interface is at http://127.0.0.1:5173; the API is on port 8787 and Storybook on 6008. Individual commands remain `npm run dev`, `npm run dev:api`, and `npm run storybook`. Stop existing instances before starting another set. The API process must be running until the hosted endpoint is deployed.

## Verify

```sh
npm test
npm run build
npm run build-storybook -- --output-dir dist/storybook
```

`scripts/evaluate-layouts.py` sends ten synthetic briefs to the configured local API and records live reliability evidence. It uses free quota; run intentionally. Browser tests cover real generation, contextual copy application, reload persistence, feedback presentation and responsive widths.

## Publish with GitHub Pages + Cloudflare

GitHub Pages hosts `dist/`; it cannot execute the Worker. `.github/workflows/pages.yml` builds the interface and Storybook into the same Pages artifact. Set the repository variable `VITE_AI_ENDPOINT` to the deployed HTTPS Worker `/companion` endpoint. Storybook defaults to the frontend's relative `storybook/` directory.

`wrangler.production.jsonc` configures six requests per minute per client key, model `gemini-3.1-flash-lite`, and the exact Pages origin `https://josephdibeh.github.io`. Configure `GEMINI_API_KEY`, `DESIGN_GUIDANCE_JSON` and `SOURCE_GUARD_TERMS` as Worker secrets. If the compact guidance exceeds Cloudflare's per-secret size limit, split the string between `DESIGN_GUIDANCE_JSON` and `DESIGN_GUIDANCE_JSON_PART_2`; the backend concatenates and validates them before use. Origin checks are not authentication; rate limits protect the demo but do not guarantee quota availability or prevent all abuse.

Deployment targets: [app](https://josephdibeh.github.io/form-and-intent/), [Storybook](https://josephdibeh.github.io/form-and-intent/storybook/), and the Worker endpoint `https://form-and-intent-api.josephdibeh.workers.dev/companion`. Pushes to `main` run tests, build both interfaces, and deploy Pages. Verify the Actions run and a live generation before sharing a release.

## Boundaries

- Use only public or synthetic notes. Prompts and supplied context are sent to Gemini; conversation text is written to browser storage but is not restored after reload. Screenshots remain in memory only, attached to their sent conversation messages and available to follow-ups. New conversation or reload clears that image context.
- Free Gemini quota can be exhausted. There is no paid fallback or fabricated live result.
- Quoted evidence is checked against source text. Model paraphrases and recommendations still require human review; they are not verified research conclusions.
- Live evaluation found omitted supplied details, invented policies and semantic component misuse in otherwise valid layouts. The PRD usefulness target remains unproven; review generated designs before use.
- Visual generation supports two screen families. Unsupported requests receive a written concept with an explicit preview limitation.
- Airtable knowledge is integrated as a manually reviewed neutral snapshot, not a live database connection or model training. Source records and the private guard list never enter the model prompt. Pattern substance can still be inferred; screening is not an absolute secrecy guarantee. Existing browser history is not retroactively scrubbed.
- See [guidance verification](docs/verification-guidance.md) for live results and remaining quality gaps.
- Live Airtable synchronization, editable Figma export, Code Connect, accounts and collaboration are not implemented.
- The original checkout demo remains in `src/App.tsx` with regression tests. `src/main.tsx` now loads `src/companion/CompanionApp.tsx`.

## Example team system

Generated previews now use **Base Web + a Careem-inspired demo theme**, separate from Form & Intent's paper/orange shell. Public [Careem colors](https://brand.careem.com/colour/) and [functional Inter typography](https://brand.careem.com/typography/) inform the theme. Catalog specimens, live previews, token inspection and Storybook share the same adapter; Gemini receives the primitive mappings and writing guidance. This is an independent demo, not Careem's internal system. Existing drafts re-render with this theme; historical theme pinning and additional systems are not yet supported.
