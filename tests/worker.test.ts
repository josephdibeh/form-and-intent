// @vitest-environment node
import { expect, test } from "vitest";
import { handleRequest } from "../server/worker";
import { examples } from "../src/system/examples";
const current = examples[0].composition;
const env = {
  GEMINI_API_KEY: "test-private-key",
  GEMINI_MODEL: "gemini-2.5-flash",
  ALLOWED_ORIGIN: "http://127.0.0.1:5173",
  ENABLED: "true",
  LOCAL_ONLY: "true",
};
const request = (
  body: unknown = {
    brief: "Emphasize delivery instructions",
    current,
    catalogVersion: "1.0.0",
  },
) =>
  new Request("http://127.0.0.1:8787/generate", {
    method: "POST",
    headers: { origin: env.ALLOWED_ORIGIN, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const provider = (value: unknown) => async () =>
  Response.json({
    candidates: [
      {
        finishReason: "STOP",
        content: { parts: [{ text: JSON.stringify(value) }] },
      },
    ],
  });
test("disabled inference fails closed", async () =>
  expect(
    (
      await handleRequest(
        request(),
        { ...env, ENABLED: "false" },
        provider(current),
      )
    ).status,
  ).toBe(503));
test("rejects unknown request properties", async () =>
  expect(
    (
      await handleRequest(
        request({
          brief: "hello",
          catalogVersion: "1.0.0",
          system: "override",
        }),
        env,
        provider(current),
      )
    ).status,
  ).toBe(400));
test("preserves provider quota failure without leaking response", async () => {
  const r = await handleRequest(
    request(),
    env,
    async () => new Response("secret upstream details", { status: 429 }),
  );
  expect(r.status).toBe(429);
  expect(await r.text()).not.toContain("secret");
});
test("rejects off-system model output", async () =>
  expect(
    (await handleRequest(request(), env, provider({ html: "bad" }))).status,
  ).toBe(502));
test("rejects changed order data in visual refinement", async () => {
  const changed = structuredClone(current);
  const block = changed.blocks.find((b) => b.type === "OrderItems");
  if (!block?.items) throw new Error("Fixture is missing items");
  block.items[0].unitPrice++;
  expect((await handleRequest(request(), env, provider(changed))).status).toBe(
    502,
  );
});
test("returns validated output without credentials", async () => {
  const r = await handleRequest(request(), env, provider(current));
  expect(r.status).toBe(200);
  expect(await r.json()).toEqual(current);
  expect(r.headers.get("access-control-allow-origin")).toBe(env.ALLOWED_ORIGIN);
});
test("rejects other origins and public local-only use", async () => {
  const req = request();
  req.headers.set("origin", "https://evil.example");
  expect((await handleRequest(req, env, provider(current))).status).toBe(403);
  const remote = new Request("https://worker.example/generate", request());
  expect((await handleRequest(remote, env, provider(current))).status).toBe(
    503,
  );
});

test("accepted bilingual compositions can be submitted for refinement", async () => {
  const large = structuredClone(current);
  const block = large.blocks.find((b) => b.type === "OrderItems");
  if (!block?.items) throw new Error("Missing fixture items");
  block.items = Array.from({ length: 10 }, () => ({
    name: { en: "ع".repeat(500), ar: "ع".repeat(500) },
    detail: { en: "ع".repeat(500), ar: "ع".repeat(500) },
    quantity: 1,
    unitPrice: 100,
  }));
  const r = await handleRequest(
    request({
      brief: "Use compact rows",
      current: large,
      catalogVersion: "1.0.0",
    }),
    env,
    provider(large),
  );
  expect(r.status).toBe(200);
});

test("chat materializes system choices and answers without forcing layout", async () => {
  const req = new Request("http://127.0.0.1:8787/chat", request());
  const r = await handleRequest(
    req,
    env,
    provider({ message: "I can explain this screen.", options: [] }),
  );
  expect(r.status).toBe(200);
  expect(await r.json()).toEqual({
    message: "I can explain this screen.",
    options: [],
  });
  const proposal = await handleRequest(
    new Request("http://127.0.0.1:8787/chat", request()),
    env,
    provider({
      message: "Delivery first.",
      options: [
        {
          label: "Delivery",
          delivery: "emphasis",
          density: "comfortable",
          promo: true,
          rationale: "Show instructions.",
        },
      ],
    }),
  );
  expect(proposal.status).toBe(200);
  const body = await proposal.json();
  expect(
    body.options[0].composition.blocks.find(
      (b: { type: string }) => b.type === "DeliveryDetails",
    ).variant,
  ).toBe("emphasis");
});
