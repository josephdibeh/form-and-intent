export const CATALOG_VERSION = "1.0.0" as const;
export const rules = {
  "clear-hierarchy":
    "Use one screen title and one primary action. Keep the final total close to the action.",
  "delivery-emphasis":
    "Emphasize delivery instructions only when they change the task priority. Preserve address and estimated arrival.",
  "compact-density":
    "Compact item rows may reduce space, but must preserve quantity, description, and price.",
  "optional-promo":
    "Promo entry is optional. Keep it secondary to the order total and primary action.",
  "semantic-intent":
    "Select roles by purpose. An action and a success status remain different even when their colors coincide.",
  "locale-direction":
    "Use logical alignment for Arabic; isolate mixed-direction values such as prices and Latin names.",
} as const;

export const catalog = {
  ScreenHeader: {
    name: "Screen header",
    description: "Introduces the task and establishes the main hierarchy.",
    variants: ["default"],
    tokens: ["text.primary", "text.secondary"],
    rule: "clear-hierarchy",
  },
  DeliveryDetails: {
    name: "Delivery details",
    description:
      "Keeps the destination, arrival estimate, and instructions together.",
    variants: ["default", "emphasis"],
    tokens: ["surface.page", "text.primary", "border.subtle"],
    rule: "delivery-emphasis",
  },
  OrderItems: {
    name: "Order items",
    description:
      "Preserves item names, quantities, and prices at either density.",
    variants: ["comfortable", "compact"],
    tokens: ["text.primary", "space.lg"],
    rule: "compact-density",
  },
  PromoCode: {
    name: "Promo code",
    description: "A secondary input with clear validation and a visible label.",
    variants: ["default"],
    tokens: ["border.control", "focus.ring"],
    rule: "optional-promo",
  },
  PriceSummary: {
    name: "Price summary",
    description:
      "Derives totals from item prices, delivery, and the demo discount.",
    variants: ["default"],
    tokens: ["text.primary", "status.success"],
    rule: "clear-hierarchy",
  },
  PrimaryAction: {
    name: "Primary action",
    description: "One clear next step. This prototype only simulates an order.",
    variants: ["default"],
    tokens: ["action.primary", "action.onPrimary"],
    rule: "semantic-intent",
  },
} as const;
export type BlockType = keyof typeof catalog;
export type RuleId = keyof typeof rules;

export function tokensForBlock(block: {
  type: BlockType;
  variant: string;
}): readonly string[] {
  if (block.type === "DeliveryDetails" && block.variant === "emphasis")
    return ["action.subtle", "action.primary", "text.primary"];
  return catalog[block.type].tokens;
}
