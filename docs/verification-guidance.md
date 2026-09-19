# Neutral guidance integration — 19 September 2026

## Delivered locally

- Six approved synthetic starter messages, two per tool. Selecting one fills an editable draft and focuses the composer; it does not send or lock the task. Existing conversation locking remains unchanged.
- Strict server-only guidance configuration; a deterministic tag selector chooses zero to three screen-relevant entries. Six entries are screen eligible. Four companion interaction principles remain outside generated-screen context.
- Only five allowlisted neutral fields per selected entry enter the model prompt. Private source records, source mappings, guard terms and pack identifiers do not. This is inference-time guidance, not training or live Airtable retrieval.
- Input and nested output screening covers known protected names, punctuation/zero-width variants, IDs, URLs, and several encoded forms. Extraction requests in the current brief or feedback notes receive a boundary response without a provider call. A subsequent legitimate request can continue.
- Every provider attempt, including repair, is checked before return. Rejected output is not returned, logged, or replayed for repair. Missing/invalid configuration fails closed. New accepted results therefore pass checks before browser persistence/export; old browser history is not retroactively scrubbed.

## Live synthetic evaluation

All six approved starters returned HTTP 200 with the correct artifact kind using the configured free-tier Gemini model. Timings: 3.7s, 19.6s, 2.2s, 2.1s, 3.6s, 2.7s. No raw source material was used. Evaluation outputs remain local and ignored by Git.

Manual review found:

- Both layout alternatives retained the supplied prices, durations, inclusions or appointment details. However, output added unsupported assumptions about duration estimates, availability and mutable prices. CTA wording sometimes implied booking completion when the next action was not specified. Layout rationale also overstated sidebar persistence.
- Payment messages fit the 130-character limit, but one expanded “another card” into “different payment method.” Scheduling labels met the four-word limit and described the next step.
- Feedback quotations matched the supplied notes and recommendations referenced valid themes. Some observations nevertheless generalized one participant to multiple participants, or strengthened “did not see an edit action” into inability to edit. These are semantic quality failures despite valid structure.

These results verify connectivity and basic task behavior, not premium design quality. A controlled with/without-guidance comparison and repeatable factual-fidelity evaluation remain outstanding. Do not claim measured improvement, coverage certification, or zero leakage.

## Privacy and operational limits

The strongest protection is data minimization: source material never reaches Gemini. Matching and prompt boundaries cannot catch every obfuscation, paraphrase or reconstruction. Neutral principles are intentionally safe to infer. Alias completeness requires maintenance when the source collection changes. Current screening also rejects URLs and known protected names supplied in legitimate briefs, requesting anonymization without confirming source membership.

Private runtime files and evaluation outputs are ignored by Git. Hosted deployment requires separately configured Worker secrets; GitHub Pages alone cannot serve this backend. No deployment or database mutation was performed for this change.

## Final automated checks

132 tests passed across 12 files, including guard failures, repair screening, input rejection, safe continuation, outbound context and starter behavior. TypeScript and production build passed; the existing JavaScript chunk-size warning remains. The production frontend scan found no configured protected source names or private binding names. Git ignore checks confirmed private configuration and evaluation files are excluded. Browser inspection confirmed that a starter fills the composer without sending.
