import { z } from "zod";
const text = (max = 1200) => z.string().trim().min(1).max(max);
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,48}$/);
export const selectionSchema = z.strictObject({
  directionId: id,
  sectionId: id,
  field: z.enum(["title", "body"]),
});
export type Selection = z.infer<typeof selectionSchema>;
export const layoutArtifactSchema = z.strictObject({
  kind: z.literal("layout"),
  title: text(160),
  recommendation: text(),
  assumptions: z.array(text(500)).max(8),
  options: z
    .array(
      z.strictObject({
        id,
        title: text(160),
        rationale: text(),
        tradeoff: text(),
        family: z.enum(["service-selection", "booking-review"]),
        arrangement: z.enum(["stacked", "split", "summary-first"]),
        sections: z
          .array(
            z.strictObject({
              id,
              component: z.enum([
                "Heading",
                "Text",
                "Choices",
                "Summary",
                "Action",
              ]),
              title: text(200),
              body: z.string().max(1600),
              items: z
                .array(
                  z.strictObject({
                    label: text(160),
                    detail: z.string().max(400),
                  }),
                )
                .max(8),
              emphasis: z.boolean(),
            }),
          )
          .min(1)
          .max(10),
      }),
    )
    .length(2),
});
export const copyArtifactSchema = z.strictObject({
  kind: z.literal("copy"),
  title: text(160),
  context: text(),
  target: selectionSchema.nullable(),
  alternatives: z
    .array(
      z.strictObject({
        text: text(1600),
        tone: text(120),
        rationale: text(600),
      }),
    )
    .length(3),
});
export const feedbackArtifactSchema = z.strictObject({
  kind: z.literal("feedback"),
  evidenceType: z.enum(["notes", "visual"]).optional(),
  title: text(160),
  sourceNotes: z.string().max(12000),
  themes: z
    .array(
      z.strictObject({
        id,
        title: text(160),
        observation: text(),
        quotes: z.array(text(1600)).max(6),
        location: z.string().max(300).optional(),
        interpretation: text(),
      }),
    )
    .min(1)
    .max(8),
  improvements: z
    .array(
      z.strictObject({
        title: text(200),
        reason: text(),
        priority: z.enum(["high", "medium", "low"]),
        themeIds: z.array(id).min(1).max(8),
      }),
    )
    .min(1)
    .max(3),
  limitations: z.array(text(600)).min(1).max(8),
});
export const artifactSchema = z.discriminatedUnion("kind", [
  layoutArtifactSchema,
  copyArtifactSchema,
  feedbackArtifactSchema,
]);
export type LayoutArtifact = z.infer<typeof layoutArtifactSchema>;
export type CopyArtifact = z.infer<typeof copyArtifactSchema>;
export type FeedbackArtifact = z.infer<typeof feedbackArtifactSchema>;
export type Artifact = z.infer<typeof artifactSchema>;
export type Tool = Artifact["kind"];
export const imageSchema = z
  .strictObject({
    mimeType: z.enum(["image/png", "image/jpeg"]),
    data: z
      .string()
      .min(4)
      .max(2_000_000)
      .regex(/^[A-Za-z0-9+/]+={0,2}$/),
  })
  .refine(
    (image) =>
      image.data.length % 4 === 0 &&
      (image.mimeType === "image/png"
        ? image.data.startsWith("iVBORw0KGgo")
        : image.data.startsWith("/9j/")),
    "Invalid image signature",
  );
export type ScreenImage = z.infer<typeof imageSchema>;
export const companionRequestSchema = z
  .strictObject({
    tool: z.enum(["layout", "copy", "feedback"]),
    brief: text(12000),
    history: z
      .array(
        z.strictObject({
          role: z.enum(["user", "assistant"]),
          text: text(12000),
        }),
      )
      .max(12),
    current: artifactSchema.optional(),
    selection: selectionSchema.optional(),
    selectedDirection: id.optional(),
    selectedCopy: z.number().int().min(0).max(2).optional(),
    sourceNotes: z.string().max(12000).optional(),
    image: imageSchema.optional(),
    operation: z.literal("translate").optional(),
  })
  .refine(
    (input) => !input.image || input.tool === "feedback",
    "Images require feedback",
  )
  .refine(
    (input) =>
      !input.operation ||
      (input.tool === "layout" && input.current?.kind === "layout"),
    "Translation requires a layout",
  );
export type CompanionRequest = z.infer<typeof companionRequestSchema>;
export const companionReplySchema = z.strictObject({
  message: text(6000),
  artifact: artifactSchema.nullable(),
});
export type CompanionReply = z.infer<typeof companionReplySchema>;
export function hasSelection(
  current: Artifact | undefined,
  selection: Selection,
) {
  return (
    current?.kind === "layout" &&
    current.options.some(
      (o) =>
        o.id === selection.directionId &&
        o.sections.some((s) => s.id === selection.sectionId),
    )
  );
}
function unique(values: string[]) {
  return new Set(values).size === values.length;
}
export function validateCompanionReply(
  value: unknown,
  input: CompanionRequest,
): CompanionReply {
  const reply = companionReplySchema.parse(value);
  const a = reply.artifact;
  if (!a) return reply;
  if (a.kind !== input.tool) throw new Error("Wrong tool artifact");
  if (a.kind === "layout") {
    if (
      !unique(a.options.map((o) => o.id)) ||
      a.options.some((o) => !unique(o.sections.map((s) => s.id)))
    )
      throw new Error("Duplicate section or direction id");
    for (const option of a.options) {
      const sections = option.sections;
      const headings = sections.filter(
        (section) => section.component === "Heading",
      );
      const actions = sections.filter(
        (section) => section.component === "Action",
      );
      const required =
        option.family === "service-selection" ? "Choices" : "Summary";
      if (
        headings.length !== 1 ||
        sections[0].component !== "Heading" ||
        actions.length !== 1 ||
        sections.at(-1)?.component !== "Action" ||
        actions[0].items.length !== 0 ||
        !sections.some((section) => section.component === required)
      ) {
        throw new Error(
          "Layout requires a heading, relevant content and one final primary action",
        );
      }
    }
    const structure = (o: LayoutArtifact["options"][number]) =>
      JSON.stringify([o.arrangement, o.sections.map((s) => s.component)]);
    if (structure(a.options[0]) === structure(a.options[1]))
      throw new Error("Directions must differ structurally");
  }
  if (a.kind === "copy") {
    if (!unique(a.alternatives.map((o) => o.text.toLocaleLowerCase())))
      throw new Error("Copy alternatives must differ");
    if (
      JSON.stringify(a.target) !== JSON.stringify(input.selection ?? null) ||
      (a.target && !hasSelection(input.current, a.target))
    )
      throw new Error("Copy target does not match selection");
  }
  if (a.kind === "feedback") {
    const visual = !!input.image;
    if (!visual && a.improvements.length !== 3)
      throw new Error("Notes require three recommendations");
    if (visual !== (a.evidenceType === "visual"))
      throw new Error("Feedback evidence mode mismatch");
    if (
      visual &&
      a.themes.some((t) => !t.location?.trim() || t.quotes.length > 0)
    )
      throw new Error(
        "Visual findings require locations without participant quotes",
      );
    if (!visual && a.themes.some((t) => t.quotes.length === 0))
      throw new Error("Feedback quotes need source evidence");
    const source = input.sourceNotes ?? input.brief;
    if (
      !source.trim() ||
      !unique(a.themes.map((t) => t.id)) ||
      a.themes.some((t) => t.quotes.some((q) => !source.includes(q)))
    )
      throw new Error("Feedback quotes need source evidence");
    if (
      a.improvements.some((i) =>
        i.themeIds.some((id) => !a.themes.some((t) => t.id === id)),
      )
    )
      throw new Error("Unknown feedback theme");
    a.sourceNotes = source;
  }
  if (input.operation === "translate") {
    if (a.kind !== "layout" || input.current?.kind !== "layout")
      throw new Error("Translation requires layout");
    const structure = (layout: LayoutArtifact) =>
      layout.options.map((o) => ({
        id: o.id,
        family: o.family,
        arrangement: o.arrangement,
        sections: o.sections.map((s) => ({
          id: s.id,
          component: s.component,
          emphasis: s.emphasis,
          items: s.items.length,
        })),
      }));
    if (
      JSON.stringify(structure(a)) !== JSON.stringify(structure(input.current))
    )
      throw new Error("Translation changed layout structure");
    const digits = (value: unknown) =>
      (JSON.stringify(value).match(/[0-9]+(?:[.,][0-9]+)*/g) ?? [])
        .sort()
        .join("|");
    for (let i = 0; i < a.options.length; i++) {
      const before = input.current.options[i].sections;
      const after = a.options[i].sections;
      for (let j = 0; j < before.length; j++) {
        if (digits(before[j]) !== digits(after[j]))
          throw new Error("Translation changed numerical facts");
      }
    }
    if (
      !/[\u0600-\u06ff]/.test(
        a.options
          .map((o) => o.sections.map((s) => s.title).join(" "))
          .join(" "),
      )
    )
      throw new Error("Translation is not Arabic");
  }
  return reply;
}
