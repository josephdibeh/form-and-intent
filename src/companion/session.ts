import { z } from "zod";
import {
  artifactSchema,
  layoutArtifactSchema,
  type Artifact,
  type LayoutArtifact,
  type Selection,
  type Tool,
  type ScreenImage,
} from "./contract";
export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  tool: Tool;
  error?: boolean;
  retry?: {
    brief: string;
    tool: Tool;
    sourceNotes?: string;
    image?: ScreenImage;
  };
  image?: ScreenImage;
  artifact?: Artifact;
  layoutContext?: LayoutArtifact;
};
export type Revision = {
  id: string;
  label: string;
  artifact: Artifact;
  layout?: LayoutArtifact;
  direction?: string;
  copyIndex?: number;
};
export type Session = {
  version: 2;
  tool: Tool;
  draft: string;
  messages: Message[];
  result?: Artifact;
  accepted?: Artifact;
  layout?: LayoutArtifact;
  selectedDirection?: string;
  acceptedDirection?: string;
  selectedCopy?: number;
  acceptedCopy?: number;
  copyBase?: LayoutArtifact;
  selection?: Selection;
  sourceNotes: string;
  revisions: Revision[];
};
const tool = z.enum(["layout", "copy", "feedback"]);
const selection = z.object({
  directionId: z.string(),
  sectionId: z.string(),
  field: z.enum(["title", "body"]),
});
const schema = z.object({
  version: z.literal(2),
  tool,
  draft: z.string().max(12000),
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(["user", "assistant"]),
        text: z.string().max(12000),
        tool,
        error: z.boolean().optional(),
        retry: z
          .object({
            brief: z.string().max(12000),
            tool,
            sourceNotes: z.string().max(12000).optional(),
          })
          .optional(),
        artifact: artifactSchema.optional(),
        layoutContext: layoutArtifactSchema.optional(),
      }),
    )
    .max(40),
  result: artifactSchema.optional(),
  accepted: artifactSchema.optional(),
  layout: artifactSchema.optional(),
  selectedDirection: z.string().optional(),
  acceptedDirection: z.string().optional(),
  selectedCopy: z.number().int().min(0).max(2).optional(),
  acceptedCopy: z.number().int().min(0).max(2).optional(),
  copyBase: layoutArtifactSchema.optional(),
  selection: selection.optional(),
  sourceNotes: z.string().max(12000),
  revisions: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        artifact: artifactSchema,
        layout: artifactSchema.optional(),
        direction: z.string().optional(),
        copyIndex: z.number().int().min(0).max(2).optional(),
      }),
    )
    .max(12),
});
export const SESSION_KEY = "form-intent-session-v2";
export function emptySession(): Session {
  return {
    version: 2,
    tool: "layout",
    draft: "",
    messages: [],
    sourceNotes: "",
    revisions: [],
  };
}
// A page opening always starts a fresh conversation; stored state is not restored.
export function startSession(): Session {
  return emptySession();
}
export function readSession(): Session {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw || raw.length > 2_000_000) return emptySession();
    const result = schema.safeParse(JSON.parse(raw));
    if (
      !result.success ||
      (result.data.layout && result.data.layout.kind !== "layout") ||
      result.data.revisions.some((r) => r.layout && r.layout.kind !== "layout")
    )
      return emptySession();
    return result.data as Session;
  } catch {
    return emptySession();
  }
}
export function saveSession(session: Session): boolean {
  try {
    // Image attachments belong to this page lifetime, never browser storage.
    const text = JSON.stringify(session, (key, value) =>
      key === "image" ? undefined : value,
    );
    if (text.length > 2_000_000) return false;
    localStorage.setItem(SESSION_KEY, text);
    return true;
  } catch {
    return false;
  }
}
export function applyCopy(
  layout: LayoutArtifact,
  selection: Selection,
  text: string,
): LayoutArtifact {
  const next = structuredClone(layout);
  const direction = next.options.find((o) => o.id === selection.directionId);
  const section = direction?.sections.find((s) => s.id === selection.sectionId);
  if (!section)
    throw new Error(
      "The selected component is no longer in this layout. Select it again.",
    );
  section[selection.field] = text;
  const checked = artifactSchema.safeParse(next);
  if (!checked.success || checked.data.kind !== "layout")
    throw new Error(
      "This copy does not fit the component contract. Choose a shorter alternative.",
    );
  return checked.data;
}
export function artifactText(a: Artifact): string {
  if (a.kind === "layout")
    return `# ${a.title}\n\n${a.recommendation}\n\n${a.options.map((o) => `## ${o.title}\n${o.rationale}\nTradeoff: ${o.tradeoff}\n\n${o.sections.map((s) => `${s.title}\n${s.body}\n${s.items.map((i) => `${i.label}: ${i.detail}`).join("\n")}`).join("\n\n")}`).join("\n\n")}\n\nAssumptions: ${a.assumptions.join("; ")}`;
  if (a.kind === "copy")
    return `# ${a.title}\n\n${a.context}\n\n${a.alternatives.map((c, i) => `## ${i + 1}. ${c.tone}\n${c.text}\n${c.rationale}`).join("\n\n")}`;
  return `# ${a.title}\n\n${a.evidenceType === "visual" ? "Visual screenshot audit; not user-testing evidence.\n\n" : ""}${a.themes.map((t) => `## ${t.title}\n${t.location ? `Location: ${t.location}\n` : ""}Observation: ${t.observation}\n${t.quotes.map((q) => `> ${q}`).join("\n")}\nInterpretation: ${t.interpretation}`).join("\n\n")}\n\n## Improvements\n${a.improvements.map((i) => `- ${i.priority}: ${i.title} — ${i.reason}`).join("\n")}\n\n## Limits\n${a.limitations.join("\n")}\n\n## Source notes\n${a.sourceNotes}`;
}
