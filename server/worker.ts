import { handleCompanion } from "./companion";
import { materializeReply, recipePrompt, recipeSchema } from "./recipes";
import { historySchema, validateChatReply } from "../src/ai/chat";
import { z } from "zod";
import { CATALOG_VERSION } from "../src/system/catalog";
import {
  compositionSchema,
  validateComposition,
  type Composition,
} from "../src/system/contract";
import { createPrompt } from "../src/ai/prompt";

export interface Env {
  DESIGN_GUIDANCE_JSON?: string;
  DESIGN_GUIDANCE_JSON_PART_2?: string;
  SOURCE_GUARD_TERMS?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL: string;
  ALLOWED_ORIGIN: string;
  ENABLED: string;
  LOCAL_ONLY: string;
  RATE_LIMITER?: {
    limit(input: { key: string }): Promise<{ success: boolean }>;
  };
}
const requestSchema = z.strictObject({
  brief: z.string().trim().min(1).max(2000),
  current: compositionSchema.optional(),
  catalogVersion: z.literal(CATALOG_VERSION),
  history: historySchema.optional(),
  selectedId: z.string().max(40).optional(),
});
async function readBounded(
  body: ReadableStream<Uint8Array> | null,
  limit: number,
) {
  if (!body) throw new Error("Empty body");
  const reader = body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw new Error("Body too large");
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}
function orderData(c: Composition) {
  return JSON.stringify(
    c.blocks
      .filter((b) => b.type === "OrderItems" || b.type === "PriceSummary")
      .map((b) =>
        b.type === "OrderItems"
          ? { type: b.type, items: b.items }
          : { type: b.type, deliveryFee: b.deliveryFee },
      ),
  );
}
export async function handleRequest(
  request: Request,
  env: Env,
  transport: typeof fetch = fetch,
): Promise<Response> {
  const origin = request.headers.get("origin");
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    Vary: "Origin",
    ...(origin === env.ALLOWED_ORIGIN
      ? { "Access-Control-Allow-Origin": origin }
      : {}),
  };
  const fail = (status: number, error: string) =>
    Response.json({ error }, { status, headers });
  const url = new URL(request.url);
  const chat = url.pathname === "/chat";
  if (!chat && url.pathname !== "/generate" && url.pathname !== "/companion")
    return fail(404, "Not found.");
  if (origin !== env.ALLOWED_ORIGIN) return fail(403, "Origin is not allowed.");
  if (request.method === "OPTIONS")
    return new Response(null, {
      status: 204,
      headers: {
        ...headers,
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  if (request.method !== "POST") return fail(405, "Use POST.");
  const local = ["127.0.0.1", "localhost"].includes(url.hostname);
  if (
    env.ENABLED !== "true" ||
    !env.GEMINI_API_KEY ||
    !/^gemini-[a-z0-9.-]+$/.test(env.GEMINI_MODEL) ||
    (env.LOCAL_ONLY === "true" && !local) ||
    (!local && !env.RATE_LIMITER)
  )
    return fail(503, "Live inference is not configured.");
  if (env.RATE_LIMITER) {
    try {
      if (
        !(
          await env.RATE_LIMITER.limit({
            key: request.headers.get("CF-Connecting-IP") || "unknown",
          })
        ).success
      )
        return fail(429, "Demo usage limit reached.");
    } catch {
      return fail(503, "Usage control is unavailable.");
    }
  }
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return fail(415, "Use application/json.");
  if (url.pathname === "/companion")
    return handleCompanion(request, env, headers, transport);
  let input: z.infer<typeof requestSchema>;
  try {
    input = requestSchema.parse(await readBounded(request.body, 128_000));
  } catch {
    return fail(400, "Invalid brief or composition.");
  }
  if (
    input.selectedId &&
    !input.current?.blocks.some((b) => b.id === input.selectedId)
  )
    return fail(400, "Selected component is missing from the current design.");
  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener("abort", abort, { once: true });
  if (request.signal.aborted) controller.abort();
  const timer = setTimeout(abort, 25_000);
  try {
    const response = await transport(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: chat
                    ? recipePrompt(
                        input.brief,
                        input.current,
                        input.history,
                        input.selectedId,
                      )
                    : createPrompt(input.brief, input.current),
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            ...(chat
              ? { responseJsonSchema: z.toJSONSchema(recipeSchema) }
              : {}),
            maxOutputTokens: 8192,
            temperature: 0.4,
          },
        }),
      },
    );
    if (response.status === 429)
      return fail(
        429,
        "The free model quota is exhausted. Your layout is safe.",
      );
    if (!response.ok)
      return fail(
        response.status === 503 ? 503 : 502,
        response.status === 503
          ? "Gemini is busy right now. Retry in a moment; your design is safe."
          : "Gemini could not complete this request. Please retry.",
      );
    const data = await readBounded(response.body, 128_000);
    const candidate = data?.candidates?.[0];
    if (candidate?.finishReason !== "STOP")
      return fail(502, "The model did not return a complete composition.");
    const text = candidate.content?.parts
      ?.filter(
        (part: { text?: string; thought?: boolean }) =>
          typeof part.text === "string" && !part.thought,
      )
      .map((part: { text: string }) => part.text)
      .join("");
    if (chat) {
      const data = materializeReply(JSON.parse(text), input.current);
      const reply = { data };
      for (const option of reply.data.options) {
        if (
          input.current &&
          orderData(input.current) !== orderData(option.composition)
        )
          return fail(
            502,
            "The proposal changed order details that should stay fixed. Ask for a visual change only, then retry.",
          );
      }
      if (new TextEncoder().encode(JSON.stringify(reply.data)).length > 140_000)
        return fail(
          502,
          "The reply was too large. Try one direction at a time.",
        );
      return Response.json(reply.data, { headers });
    }
    const result = validateComposition(JSON.parse(text));
    if (!result.success)
      return fail(502, "The proposed layout failed system validation.");
    if (input.current && orderData(input.current) !== orderData(result.data))
      return fail(502, "The proposed refinement changed protected order data.");
    if (new TextEncoder().encode(JSON.stringify(result.data)).length > 64_000)
      return fail(
        502,
        "The proposed layout exceeds the client response limit.",
      );
    return Response.json(result.data, { headers });
  } catch {
    return fail(
      controller.signal.aborted ? 504 : 502,
      controller.signal.aborted
        ? "The model request timed out or was cancelled."
        : "The model response could not be validated.",
    );
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener("abort", abort);
  }
}
export default {
  fetch: (request: Request, env: Env) => handleRequest(request, env),
};
