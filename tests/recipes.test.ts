import { test, expect } from "vitest";
import { materializeReply } from "../server/recipes";
import { examples } from "../src/system/examples";
import { validateComposition } from "../src/system/contract";
test("model choices change layout while order data stays owned by the app", () => {
  const base = validateComposition(examples[0].composition);
  if (!base.success) throw Error("fixture");
  const reply = materializeReply(
    {
      message: "Two directions",
      options: [
        {
          label: "Delivery first",
          delivery: "emphasis",
          density: "comfortable",
          promo: true,
          rationale: "Instructions take priority.",
        },
        {
          label: "Compact",
          delivery: "default",
          density: "compact",
          promo: false,
          rationale: "Reduce secondary content.",
        },
      ],
    },
    base.data,
  );
  expect(reply.options).toHaveLength(2);
  for (const o of reply.options) {
    expect(
      o.composition.blocks.find((b) => b.type === "OrderItems")?.items,
    ).toEqual(base.data.blocks.find((b) => b.type === "OrderItems")?.items);
  }
  expect(
    reply.options[1].composition.blocks.some((b) => b.type === "PromoCode"),
  ).toBe(false);
});
test("invented change properties are rejected", () =>
  expect(() =>
    materializeReply({
      message: "Change",
      options: [
        {
          label: "A",
          delivery: "emphasis",
          density: "compact",
          promo: false,
          rationale: "x",
          price: 0,
        },
      ],
    }),
  ).toThrow());
