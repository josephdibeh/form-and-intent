import { resolveTeamToken } from "./team-system";

export const componentCatalog = {
  Heading: {
    usage:
      "Lead with the purpose of this screen. Keep the main heading concise.",
    tokens: ["text.primary", "font.body", "space.md"],
  },
  Text: {
    usage:
      "Explain a decision or provide supporting context in plain language.",
    tokens: ["text.secondary", "font.body", "space.md"],
  },
  Choices: {
    usage:
      "Compare services using consistent labels and details. These are preview choices.",
    tokens: [
      "border.control",
      "surface.raised",
      "surface.selected",
      "radius.panel",
      "space.lg",
    ],
  },
  Summary: {
    usage: "Make the consequences of a choice visible before commitment.",
    tokens: [
      "surface.selected",
      "text.primary",
      "text.secondary",
      "radius.panel",
    ],
  },
  Action: {
    usage:
      "Name the next step. The button simulates a preview action; use Inspect separately.",
    tokens: ["action.primary", "action.onPrimary", "radius.control"],
  },
} as const;
export type ComponentName = keyof typeof componentCatalog;
export function tokenDetails(component: ComponentName) {
  return componentCatalog[component].tokens.map((role) => ({
    role,
    css: `--team-${role.replaceAll(".", "-")}`,
    value: resolveTeamToken(role).value,
  }));
}
export function storyUrl(component: ComponentName) {
  const base =
    import.meta.env.VITE_STORYBOOK_URL ||
    `${import.meta.env.BASE_URL}storybook/`;
  return `${base.replace(/\/$/, "")}/?path=/story/companion-components--${component.toLowerCase()}`;
}
