import { expect, it, vi } from "vitest";
import { generateComposition } from "../src/ai/client";
import { examples } from "../src/system/examples";

it("returns only validated server output", async () => {
  const transport = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(examples[0].composition)));
  const result = await generateComposition(
    "https://example.test/generate",
    "A checkout screen",
    undefined,
    new AbortController().signal,
    transport,
  );
  expect(result.catalogVersion).toBe("1.0.0");
});
it("rejects malformed output rather than passing it to the renderer", async () => {
  const transport = vi.fn().mockResolvedValue(new Response('{"blocks":[]}'));
  await expect(
    generateComposition(
      "https://example.test/generate",
      "A checkout screen",
      undefined,
      new AbortController().signal,
      transport,
    ),
  ).rejects.toThrow("system contract");
});
it("explains quota exhaustion and rejects insecure endpoints", async () => {
  const transport = vi
    .fn()
    .mockResolvedValue(new Response("", { status: 429 }));
  await expect(
    generateComposition(
      "https://example.test/generate",
      "A checkout screen",
      undefined,
      new AbortController().signal,
      transport,
    ),
  ).rejects.toThrow("limit");
  await expect(
    generateComposition(
      "http://example.test/generate",
      "A checkout screen",
      undefined,
      new AbortController().signal,
      transport,
    ),
  ).rejects.toThrow("HTTPS");
});
