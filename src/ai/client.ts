import { validateComposition, type Composition } from "../system/contract";
import { CATALOG_VERSION } from "../system/catalog";

export async function generateComposition(
  endpoint: string,
  brief: string,
  current: Composition | undefined,
  signal: AbortSignal,
  transport: typeof fetch = fetch,
): Promise<Composition> {
  const url = new URL(endpoint);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("The AI endpoint must use HTTPS.");
  if (!brief.trim() || brief.length > 2000)
    throw new Error("Write a brief between 1 and 2,000 characters.");
  const response = await transport(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    signal,
    body: JSON.stringify({
      brief: brief.trim(),
      current,
      catalogVersion: CATALOG_VERSION,
    }),
  });
  if (response.status === 429)
    throw new Error(
      "The demo has reached its usage limit. Your last valid layout is still here.",
    );
  if (!response.ok)
    throw new Error(
      "The AI service is unavailable. Try again later; your layout is safe.",
    );
  const reader = response.body?.getReader();
  if (!reader) throw new Error("The AI service returned an empty response.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 64_000) {
        await reader.cancel();
        throw new Error(
          "The AI response exceeded the system contract size limit.",
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let input: unknown;
  try {
    input = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error("The AI response did not match the system contract.");
  }
  const result = validateComposition(input);
  if (!result.success)
    throw new Error(
      `The AI response did not match the system contract: ${result.error}`,
    );
  return result.data;
}
