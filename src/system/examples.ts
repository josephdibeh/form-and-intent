const base = {
  catalogVersion: "1.0.0",
  title: { en: "Your order, considered.", ar: "طلبك، بكل عناية." },
  blocks: [
    {
      id: "header",
      type: "ScreenHeader",
      variant: "default",
      eyebrow: { en: "THE LUNCH EDIT", ar: "اختيار الغداء" },
      subtitle: {
        en: "A little good food. A better afternoon.",
        ar: "وجبة لذيذة ليوم أجمل.",
      },
    },
    {
      id: "delivery",
      type: "DeliveryDetails",
      variant: "default",
      address: {
        en: "Home · West Bay, Doha",
        ar: "المنزل · الخليج الغربي، الدوحة",
      },
      eta: { en: "25–35 min", ar: "٢٥–٣٥ دقيقة" },
      instructions: {
        en: "Ring the bell. Leave at the door if unavailable.",
        ar: "يرجى قرع الجرس وترك الطلب عند الباب إذا لم أكن متاحًا.",
      },
    },
    {
      id: "items",
      type: "OrderItems",
      variant: "comfortable",
      items: [
        {
          name: { en: "Roasted chicken bowl", ar: "طبق الدجاج المشوي" },
          detail: {
            en: "Herbed rice, tahini, garden greens",
            ar: "أرز بالأعشاب، طحينة وخضار طازجة",
          },
          quantity: 1,
          unitPrice: 4800,
        },
        {
          name: { en: "Citrus & mint", ar: "حمضيات ونعناع" },
          detail: { en: "Freshly pressed · 300 ml", ar: "عصير طازج · ٣٠٠ مل" },
          quantity: 1,
          unitPrice: 1600,
        },
      ],
    },
    { id: "promo", type: "PromoCode", variant: "default" },
    {
      id: "total",
      type: "PriceSummary",
      variant: "default",
      deliveryFee: 1000,
    },
    {
      id: "action",
      type: "PrimaryAction",
      variant: "default",
      label: { en: "Place demo order", ar: "تجربة تأكيد الطلب" },
    },
  ],
  decisions: [
    {
      blockId: "header",
      rule: "clear-hierarchy",
      explanation:
        "A single title establishes the task. The final total and primary action close the screen.",
    },
    {
      blockId: "delivery",
      rule: "delivery-emphasis",
      explanation:
        "Delivery context appears before the items, so the customer can confirm where the order is going.",
    },
    {
      blockId: "action",
      rule: "semantic-intent",
      explanation:
        "The primary action uses action.primary. Confirmation feedback uses status.success, a separate semantic role.",
    },
  ],
  unsupported: [],
};

const delivery = structuredClone(base);
delivery.blocks[1].variant = "emphasis";
delivery.decisions[1].explanation = "Instructions take priority";
const compact = structuredClone(base);
compact.blocks = compact.blocks.filter((block) => block.type !== "PromoCode");
compact.blocks.find((block) => block.type === "OrderItems")!.variant =
  "compact";
compact.decisions.push({
  blockId: "items",
  rule: "compact-density",
  explanation:
    "Tighter item spacing and no optional promo field reduce scanning effort without removing essential information.",
});

export const examples = [
  {
    id: "balanced",
    name: "The balanced checkout",
    short: "Balanced",
    description: "Clear hierarchy, room to breathe.",
    brief:
      "Design a mobile food-order summary with delivery details, two items, a promo code, and a clear payment action. Keep it calm and easy to scan.",
    composition: base,
  },
  {
    id: "delivery",
    name: "Instructions in focus",
    short: "Delivery first",
    description: "Give delivery instructions more presence.",
    brief:
      "Keep the order summary, but give delivery instructions more prominence. Preserve the order items, prices, and primary action.",
    composition: delivery,
  },
  {
    id: "compact",
    name: "A shorter path",
    short: "Compact",
    description: "A little less space. The same clarity.",
    brief:
      "Create a compact order summary. Remove the optional promo field, retain item descriptions and quantities, and keep the total clear.",
    composition: compact,
  },
];
