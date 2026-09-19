import { expect, test } from "vitest";
import { validateChatReply } from "../src/ai/chat";
import { examples } from "../src/system/examples";
test("accepts an answer without forcing a screen", () =>
  expect(
    validateChatReply({ message: "Which part should we improve?", options: [] })
      .success,
  ).toBe(true));
test("rejects invented components inside proposals", () =>
  expect(
    validateChatReply({
      message: "Try this",
      options: [{ label: "Idea", composition: { blocks: [] } }],
    }).success,
  ).toBe(false));
test("rejects identical alternatives", () =>
  expect(
    validateChatReply({
      message: "Two ideas",
      options: [
        { label: "A", composition: examples[0].composition },
        { label: "B", composition: examples[0].composition },
      ],
    }).success,
  ).toBe(false));
test("different internal IDs do not make alternatives visually distinct", () => {
  const second = structuredClone(examples[0].composition);
  second.blocks.forEach((b) => {
    const old = b.id;
    b.id += "-copy";
    second.decisions.forEach((d) => {
      if (d.blockId === old) d.blockId = b.id;
    });
  });
  expect(
    validateChatReply({
      message: "Two directions",
      options: [
        { label: "A", composition: examples[0].composition },
        { label: "B", composition: second },
      ],
    }).success,
  ).toBe(false);
});
