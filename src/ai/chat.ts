import { z } from "zod";
import {
  compositionSchema,
  validateComposition,
  type Composition,
} from "../system/contract";
import { CATALOG_VERSION } from "../system/catalog";
export const historySchema = z
  .array(
    z.strictObject({
      role: z.enum(["user", "assistant"]),
      text: z.string().min(1).max(4000),
    }),
  )
  .max(12);
export type ChatHistory = z.infer<typeof historySchema>;
export const chatReplySchema = z.strictObject({
  message: z.string().trim().min(1).max(4000),
  options: z
    .array(
      z.strictObject({
        label: z.string().min(1).max(80),
        composition: compositionSchema,
      }),
    )
    .max(2),
});
export type ChatReply = z.infer<typeof chatReplySchema>;
export function validateChatReply(input: unknown) {
  const parsed = chatReplySchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false as const,
      error: "The reply did not match the conversation contract.",
    };
  for (const option of parsed.data.options) {
    const result = validateComposition(option.composition);
    if (!result.success) return result;
  }
  if (
    parsed.data.options.length === 2 &&
    JSON.stringify(
      parsed.data.options[0].composition.blocks.map(
        ({ id, ...props }) => props,
      ),
    ) ===
      JSON.stringify(
        parsed.data.options[1].composition.blocks.map(
          ({ id, ...props }) => props,
        ),
      )
  )
    return {
      success: false as const,
      error: "The alternatives are identical. Ask for a different direction.",
    };
  return { success: true as const, data: parsed.data };
}
export async function sendChat(
  endpoint: string,
  brief: string,
  current: Composition,
  history: ChatHistory,
  selectedId: string | undefined,
  signal: AbortSignal,
): Promise<ChatReply> {
  const url = new URL(endpoint);
  url.pathname = url.pathname.replace(/\/generate\/?$/, "/chat");
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("The AI endpoint must use HTTPS.");
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      signal,
      body: JSON.stringify({
        brief,
        current,
        history: history.slice(-12),
        selectedId,
        catalogVersion: CATALOG_VERSION,
      }),
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error(
      "Cannot reach the local AI backend. Start it with npm run dev:api, then retry. Your design is safe.",
    );
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("The AI service returned an empty response.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 140_000) {
        await reader.cancel();
        throw new Error("The AI reply was too large. Your design is safe.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }
  let data;
  try {
    data = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error(
      "The AI service returned an unreadable reply. Retry your message.",
    );
  }
  if (!response.ok)
    throw new Error(
      typeof data.error === "string"
        ? data.error.slice(0, 500)
        : "The AI service is unavailable. Your design is safe.",
    );
  const parsed = validateChatReply(data);
  if (!parsed.success) throw new Error(parsed.error);
  return parsed.data;
}
