# Careem-inspired Base Web example system

Approved target: a real externally sourced component system for generated screens, separate from the companion shell. Base Web supplies primitives; Careem public guidance supplies color and functional Inter typography. Clearly label the result as a demo, not Careem's internal library.

1. Install Base Web and Styletron plus bundled Inter. Build an isolated provider and shared section adapter with actual typography, cards, radio groups and buttons. Keep inspection controls outside interactive children.
2. Define source-attributed theme tokens and primitive mappings in a shared metadata module. Use it in component inspector, catalog and server prompt. Preserve the validated section contract; model cannot emit code.
3. Update catalog attribution and specimens, existing Storybook renderer, and third-party notices. Keep Form & Intent global styles unchanged.
4. Verify tests, production builds, interaction/inspection, token resolution, contrast pairs, RTL and narrow/desktop layouts. Record remaining model-quality limitations. No deployment.

Sources checked 2026-09-18: https://brand.careem.com/colour/ ; https://brand.careem.com/typography/ ; https://brand.careem.com/tone-of-voice/ ; https://github.com/uber/baseweb/blob/main/LICENSE . Palette values are published brand values; semantic mapping, spacing and radii are demo design decisions. Inter is the documented functional font; proprietary Careem display fonts are not bundled.

Completed: real Base Web adapters, isolated team theme, 17 semantic token roles, source-attributed catalog and inspector, server system context, and distributed MIT/OFL notices. Verified109 tests, app/Storybook builds, browser desktop/mobile/RTL and a successful live Gemini request. Known limits are recorded in docs/verification-three-tools.md.
