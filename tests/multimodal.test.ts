import { expect, test } from "vitest";
import {
  companionRequestSchema,
  validateCompanionReply,
} from "../src/companion/contract";
const image = { mimeType: "image/png", data: "iVBORw0KGgo=" };
test("images are accepted only for feedback and invalid data is rejected", () => {
  expect(
    companionRequestSchema.safeParse({
      tool: "feedback",
      brief: "Audit",
      history: [],
      image,
    }).success,
  ).toBe(true);
  expect(
    companionRequestSchema.safeParse({
      tool: "layout",
      brief: "Audit",
      history: [],
      image,
    }).success,
  ).toBe(false);
  expect(
    companionRequestSchema.safeParse({
      tool: "feedback",
      brief: "Audit",
      history: [],
      image: { ...image, data: "not an image" },
    }).success,
  ).toBe(false);
});
const audit = {
  message: "Review",
  artifact: {
    kind: "feedback",
    title: "Visual audit",
    evidenceType: "visual",
    sourceNotes: "",
    themes: [
      {
        id: "cta",
        title: "Competing actions",
        location: "Bottom action row",
        observation: "Two equally prominent buttons.",
        interpretation: "May make priority unclear.",
        quotes: [],
      },
    ],
    improvements: [1, 2, 3].map((i) => ({
      title: `Fix ${i}`,
      reason: "Clarify hierarchy.",
      priority: "medium",
      themeIds: ["cta"],
    })),
    limitations: ["Static screenshot; behavior is not tested."],
  },
};
test("visual evidence requires an attached screenshot and a location", () => {
  expect(() =>
    validateCompanionReply(audit, {
      tool: "feedback",
      brief: "Audit",
      history: [],
      image,
    } as never),
  ).not.toThrow();
  expect(() =>
    validateCompanionReply(audit, {
      tool: "feedback",
      brief: "Audit",
      history: [],
    }),
  ).toThrow();
  const missing = structuredClone(audit);
  missing.artifact.themes[0].location = "";
  expect(() =>
    validateCompanionReply(missing, {
      tool: "feedback",
      brief: "Audit",
      history: [],
      image,
    } as never),
  ).toThrow();
});
const layout = {
  kind: "layout",
  title: "Plans",
  recommendation: "Compare",
  assumptions: [],
  options: ["stacked", "split"].map((arrangement, i) => ({
    id: `d${i}`,
    title: "Plan",
    rationale: "Compare",
    tradeoff: "Space",
    family: "service-selection",
    arrangement,
    sections: [
      {
        id: "h",
        component: "Heading",
        title: "Choose",
        body: "",
        items: [],
        emphasis: false,
      },
      {
        id: "c",
        component: "Choices",
        title: "Plans",
        body: "",
        items: [{ label: "One-off", detail: "QAR 160 / 3 hours" }],
        emphasis: false,
      },
      {
        id: "a",
        component: "Action",
        title: "Continue",
        body: "",
        items: [],
        emphasis: true,
      },
    ],
  })),
};
test("Arabic translation preserves structure and numerical facts", () => {
  const translated = structuredClone(layout);
  for (const o of translated.options)
    for (const s of o.sections) s.title = "اختر الخدمة";
  const input = {
    tool: "layout",
    operation: "translate",
    brief: "Translate",
    history: [],
    current: layout,
  } as never;
  expect(() =>
    validateCompanionReply({ message: "Done", artifact: translated }, input),
  ).not.toThrow();
  const changed = structuredClone(translated);
  changed.options[0].sections[1].items[0].detail = "QAR 180 / 3 hours";
  expect(() =>
    validateCompanionReply({ message: "Done", artifact: changed }, input),
  ).toThrow("numerical facts");
  const reordered = structuredClone(translated);
  reordered.options[0].sections[1].id = "different";
  expect(() =>
    validateCompanionReply({ message: "Done", artifact: reordered }, input),
  ).toThrow("structure");
  expect(() =>
    validateCompanionReply({ message: "Done", artifact: layout }, input),
  ).toThrow("not Arabic");
});
