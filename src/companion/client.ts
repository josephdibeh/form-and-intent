import {
  companionRequestSchema,
  validateCompanionReply,
  type CompanionRequest,
  type CompanionReply,
} from "./contract";
async function readReply(
  body: ReadableStream<Uint8Array> | null,
): Promise<unknown> {
  if (!body) throw new Error("The service returned an empty response.");
  const reader = body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 256000) {
        await reader.cancel();
        throw new Error("The response is too large. Try a smaller request.");
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
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error("The service response failed validation. Please retry.");
  }
}
export async function sendCompanion(
  endpoint: string,
  input: CompanionRequest,
  signal?: AbortSignal,
  transport: typeof fetch = fetch,
): Promise<CompanionReply> {
  const url = new URL(endpoint);
  url.pathname = url.pathname.replace(/\/(generate|chat)\/?$/, "/companion");
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("The AI endpoint must use HTTPS.");
  const parsed = companionRequestSchema.parse(input);
  const body = JSON.stringify(parsed);
  if (new TextEncoder().encode(body).length > 2_300_000)
    throw new Error(
      "The request is too large. Shorten the conversation or source notes.",
    );
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    abort();
  }, 50000);
  try {
    if (signal?.aborted)
      throw new DOMException("Request cancelled", "AbortError");
    let response: Response;
    try {
      response = await transport(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        signal: controller.signal,
        body,
      });
    } catch (error) {
      if (controller.signal.aborted || signal?.aborted) throw error;
      throw new Error(
        `Cannot connect to ${url.origin}. Check that the AI service is running and allows this site's origin, then retry.`,
      );
    }
    if (!response.ok) {
      const messages: Record<number, string> = {
        400: "The request is invalid. Shorten the brief or clear the selection and retry.",
        403: "This site is not allowed by the AI service. Check its allowed origin.",
        429: "The free model quota or demo limit is exhausted. Try again later.",
        503: "The AI service is busy or not configured. Retry in a moment.",
        504: "The model request timed out. Please retry.",
      };
      let detail: unknown;
      try {
        detail = await readReply(response.body);
      } catch {
        /* Fall back to status guidance. */
      }
      const safeErrors = new Set([
        "Design guidance protection is unavailable. Please retry later.",
        "The response could not be safely displayed. Rephrase your design request and retry.",
        "Please remove product names, source links, or internal identifiers from the conversation and start a new request.",
        "Live inference is not configured.",
        "Usage control is unavailable.",
        "Demo usage limit reached.",
        "The free model quota is exhausted. Try again later.",
        "The model is busy. Retry in a moment.",
        "The model returned an incomplete result. Please retry.",
        "The model result failed validation. Please retry with a more specific brief.",
        "Selected content is missing from the current layout.",
        "Invalid request. Keep the brief under 12,000 characters.",
      ]);
      const serverError =
        detail && typeof detail === "object" && "error" in detail
          ? detail.error
          : undefined;
      if (typeof serverError === "string" && safeErrors.has(serverError))
        throw new Error(serverError);
      throw new Error(
        messages[response.status] ??
          "The model could not complete this request. Please retry.",
      );
    }
    const value = await readReply(response.body);
    try {
      return validateCompanionReply(value, parsed);
    } catch {
      throw new Error(
        "The model result failed validation. Please retry with a more specific brief.",
      );
    }
  } catch (error) {
    if (timedOut)
      throw new Error(
        "The request timed out. Your work is preserved; please retry.",
      );
    if (signal?.aborted)
      throw new DOMException("Request cancelled", "AbortError");
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
