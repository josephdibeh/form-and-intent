# Arabic layout and screenshot audit — 19 September 2026

Implemented locally, not deployed. Uses the existing Gemini Worker; no database or Airtable runtime connection.

## Translation

The Arabic control sends the current layout for translation. Server and client validate the same IDs, ordering, component types, item counts, emphasis, families, arrangements and per-section numeric values. Arabic text must be present. It preserves the original English artifact and caches the translated variant by exact artifact content. New results cancel stale translation requests. Copy and JSON export use the displayed translation. The app shell stays English.

Live API translation succeeded after an initial validation rejection. A separate browser generation and translation succeeded; Arabic headings, option labels, details and actions appeared in RTL. Human review is still needed for translation fluency and non-numeric semantic fidelity. An invalid response leaves the English design available for retry.

## Screenshot audit

Feedback supports one PNG/JPG/WebP file up to 10 MB. The browser decodes and re-encodes to JPEG, stripping original metadata and constraining the longest side to 1600 pixels. The resulting base64 payload is capped at two million characters. HEIC requires conversion to PNG/JPG. It is previewed before submission, removable, retained in memory for follow-ups, and cleared on reload/new conversation. The app does not upload it to persistent storage or include it in history/exports. Gemini receives the pixels on submission, subject to provider data handling.

The backend sends inline image data separately from textual context, with the same source-isolation output checks. Visual findings require locations and empty participant-quote arrays. Notes synthesis retains exact source-quote validation. Visual recommendations allow one to three supported improvements; screenshot review cannot establish interaction behavior, exact contrast ratios or accessibility compliance.

Verified a live API audit and a complete browser upload → preview → submit → findings flow with a self-created dummy cleaning screen. Gemini identified equal-weight Back/Book actions and missing visible selection affordances. The first audit also produced an unsupported third recommendation, so the contract was relaxed to one-to-three to avoid forced padding. Model judgments remain suggestions to review, not proven usability findings.

Sample prompt prefixes were removed. Fresh conversation on reload remains active.
