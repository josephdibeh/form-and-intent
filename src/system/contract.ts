import { z } from "zod";
import tokens from "./tokens.json";
import { CATALOG_VERSION, rules } from "./catalog";

const copy = z.string().trim().min(1).max(500);
const bilingual = z.strictObject({ en: copy, ar: copy });
const id = z.string().regex(/^[a-z][a-z0-9-]{0,39}$/);
const common = { id };
export const blockSchema = z.discriminatedUnion("type", [
  z.strictObject({
    ...common,
    type: z.literal("ScreenHeader"),
    variant: z.literal("default"),
    eyebrow: bilingual,
    subtitle: bilingual,
  }),
  z.strictObject({
    ...common,
    type: z.literal("DeliveryDetails"),
    variant: z.enum(["default", "emphasis"]),
    address: bilingual,
    eta: bilingual,
    instructions: bilingual,
  }),
  z.strictObject({
    ...common,
    type: z.literal("OrderItems"),
    variant: z.enum(["comfortable", "compact"]),
    items: z
      .array(
        z.strictObject({
          name: bilingual,
          detail: bilingual,
          quantity: z.number().int().min(1).max(20),
          unitPrice: z.number().int().min(0).max(100_000),
        }),
      )
      .min(1)
      .max(10),
  }),
  z.strictObject({
    ...common,
    type: z.literal("PromoCode"),
    variant: z.literal("default"),
  }),
  z.strictObject({
    ...common,
    type: z.literal("PriceSummary"),
    variant: z.literal("default"),
    deliveryFee: z.number().int().min(0).max(10_000),
  }),
  z.strictObject({
    ...common,
    type: z.literal("PrimaryAction"),
    variant: z.literal("default"),
    label: bilingual,
  }),
]);
export const compositionSchema = z
  .strictObject({
    catalogVersion: z.literal(CATALOG_VERSION),
    title: bilingual,
    blocks: z.array(blockSchema).min(5).max(6),
    decisions: z
      .array(
        z.strictObject({
          blockId: id,
          rule: z.enum(
            Object.keys(rules) as [
              keyof typeof rules,
              ...(keyof typeof rules)[],
            ],
          ),
          explanation: copy,
        }),
      )
      .min(1)
      .max(10),
    unsupported: z.array(copy).max(6),
  })
  .superRefine((value, ctx) => {
    const ids = new Set(value.blocks.map((block) => block.id));
    const types = value.blocks.map((block) => block.type);
    const issue = (message: string) =>
      ctx.addIssue({ code: "custom", message });
    if (
      ids.size !== value.blocks.length ||
      new Set(types).size !== types.length
    )
      issue("Component IDs and types must be unique.");
    for (const type of [
      "ScreenHeader",
      "DeliveryDetails",
      "OrderItems",
      "PriceSummary",
      "PrimaryAction",
    ]) {
      if (!types.includes(type as (typeof types)[number]))
        issue(`Required component missing: ${type}`);
    }
    if (
      types[0] !== "ScreenHeader" ||
      types.at(-1) !== "PrimaryAction" ||
      types.at(-2) !== "PriceSummary"
    )
      issue(
        "Keep the header first and the total directly before the final action.",
      );
    for (const decision of value.decisions)
      if (!ids.has(decision.blockId))
        issue("Decision references a missing component.");
  });

export type Composition = z.infer<typeof compositionSchema>;
export type Block = Composition["blocks"][number];
export type Locale = "en" | "ar";

export function validateComposition(input: unknown) {
  try {
    if (JSON.stringify(input).length > 32_000)
      return {
        success: false as const,
        error: "The composition is too large.",
      };
    const result = compositionSchema.safeParse(input);
    if (!result.success)
      return {
        success: false as const,
        error: result.error.issues[0]?.message ?? "Invalid composition.",
      };
    return { success: true as const, data: result.data };
  } catch {
    return {
      success: false as const,
      error: "The composition cannot be read.",
    };
  }
}

export function resolveToken(
  role: string,
  references: Record<string, string> = tokens.reference,
) {
  const reference = (tokens.semantic as Record<string, string>)[role];
  if (!reference || !references[reference])
    throw new Error(`Unknown token: ${role}`);
  return { role, reference, value: references[reference] };
}

export function calculateTotal(
  composition: Composition,
  promoApplied: boolean,
) {
  const items = composition.blocks.find((block) => block.type === "OrderItems");
  const summary = composition.blocks.find(
    (block) => block.type === "PriceSummary",
  );
  const subtotal =
    items?.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    ) ?? 0;
  const delivery = summary?.deliveryFee ?? 0;
  const discount =
    promoApplied &&
    composition.blocks.some((block) => block.type === "PromoCode")
      ? Math.round(subtotal * 0.1)
      : 0;
  return {
    subtotal,
    delivery,
    discount,
    total: subtotal + delivery - discount,
  };
}
