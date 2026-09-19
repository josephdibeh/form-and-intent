/** Public brand values; semantic assignments and layout rules are demo decisions. */
export const teamSystem = {
  id: "careem-baseweb-demo-v1",
  name: "Careem-inspired",
  version: "1.0",
  foundation: "Base Web 18.2",
  description:
    "Independent demo theme using Careem public brand guidance and Uber Base Web. Not Careem’s internal design system.",
  sources: {
    color: "https://brand.careem.com/colour/",
    typography: "https://brand.careem.com/typography/",
    voice: "https://brand.careem.com/tone-of-voice/",
    code: "https://github.com/uber/baseweb",
  },
  tokens: {
    reference: {
      "color.green": "#00E784",
      "color.forest": "#00493E",
      "color.lightGreen": "#D6FFEA",
      "color.midnight": "#001942",
      "color.offWhite": "#FAFFFC",
      "color.white": "#FFFFFF",
      "space.2": "8px",
      "space.3": "12px",
      "space.4": "16px",
      "space.6": "24px",
      "radius.control": "12px",
      "radius.card": "16px",
      "font.ui": "'Inter Variable', 'Noto Sans Arabic', sans-serif",
    },
    semantic: {
      "surface.page": "color.offWhite",
      "surface.raised": "color.white",
      "surface.selected": "color.lightGreen",
      "text.primary": "color.midnight",
      "text.secondary": "color.forest",
      "border.subtle": "color.lightGreen",
      "border.control": "color.forest",
      "action.primary": "color.green",
      "action.onPrimary": "color.forest",
      "focus.ring": "color.forest",
      "space.sm": "space.2",
      "space.md": "space.3",
      "space.lg": "space.4",
      "space.xl": "space.6",
      "radius.control": "radius.control",
      "radius.panel": "radius.card",
      "font.body": "font.ui",
    },
  },
} as const;
export function resolveTeamToken(role: string) {
  const reference =
    teamSystem.tokens.semantic[role as keyof typeof teamSystem.tokens.semantic];
  if (!reference) throw new Error(`Unknown team token: ${role}`);
  return { reference, value: teamSystem.tokens.reference[reference] };
}
export const primitiveMappings = {
  Heading: {
    primitives: "HeadingSmall + ParagraphSmall",
    docs: "https://baseweb.design/components/typography/",
  },
  Text: {
    primitives: "LabelMedium + ParagraphSmall",
    docs: "https://baseweb.design/components/typography/",
  },
  Choices: {
    primitives: "RadioGroup + Radio",
    docs: "https://baseweb.design/components/radio/",
  },
  Summary: {
    primitives: "Card + LabelSmall",
    docs: "https://baseweb.design/components/card/",
  },
  Action: {
    primitives: "Button",
    docs: "https://baseweb.design/components/button/",
  },
} as const;
export const teamSystemInstruction = `The active example team system is Careem-inspired demo v1, built on Uber Base Web, not Careem's internal library. Renderer bindings: Heading=HeadingSmall+ParagraphSmall; Text=LabelMedium+ParagraphSmall; Choices=RadioGroup with one Radio per actual service option (detail contains its facts, never make a fact a separate selectable option); Summary=Card with labeled fact rows; Action=Button. Theme uses Careem public green #00E784, forest #00493E, off-white #FAFFFC and functional Inter typography. These mappings and theme tokens are fixed; do not invent component APIs, colors or fonts. Voice: concise, warm and straightforward; clear next steps, no unsupported reassurance, pressure or exaggerated promises. Branding must never alter supplied facts or claim affiliation. Keep semantic intent distinct: Choices are mutually exclusive options; Summary is information, not a control.`;
