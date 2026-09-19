import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { test, expect, vi, afterEach } from "vitest";
import App from "../src/App";
import { examples } from "../src/system/examples";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function start() {
  vi.stubEnv("VITE_AI_ENDPOINT", "https://example.test/generate");
  render(<App />);
  fireEvent.change(screen.getByLabelText("Message the companion"), {
    target: { value: "Make it compact" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
}
test("chat proposes a design, requires acceptance, and keeps conversation visible", async () => {
  vi.stubGlobal("fetch", async () =>
    Response.json({
      message: "I reduced row density and kept the total clear.",
      options: [
        { label: "Compact direction", composition: examples[2].composition },
      ],
    }),
  );
  start();
  expect(screen.getByText("Make it compact")).toBeVisible();
  await screen.findByText("I reduced row density and kept the total clear.");
  fireEvent.click(
    screen.getByRole("button", { name: "Preview Compact direction" }),
  );
  expect(screen.getByText("Draft proposal · not accepted")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Accept design" }));
  expect(
    screen.getByText("Live AI composition · validated contract"),
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Restore revision 0" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Restore revision 0" }));
  expect(screen.getByLabelText("Promo code")).toBeInTheDocument();
});
test("an answer does not replace the preview and error supports retry", async () => {
  let attempt = 0;
  vi.stubGlobal("fetch", async () =>
    ++attempt === 1
      ? Response.json({ error: "Gemini is busy right now." }, { status: 503 })
      : Response.json({
          message: "I can help with hierarchy and delivery clarity.",
          options: [],
        }),
  );
  start();
  await screen.findByText("Gemini is busy right now.");
  fireEvent.click(screen.getByRole("button", { name: "Retry message" }));
  await screen.findByText("I can help with hierarchy and delivery clarity.");
  expect(
    screen.getByText("Saved example · not a live AI result"),
  ).toBeVisible();
});

test("clears selected context when a proposal omits that component", async () => {
  vi.stubEnv("VITE_AI_ENDPOINT", "https://example.test/generate");
  const sent: unknown[] = [];
  vi.stubGlobal("fetch", async (_url: unknown, init: RequestInit) => {
    sent.push(JSON.parse(String(init.body)));
    return Response.json({
      message: "Here is a compact option.",
      options: [{ label: "Compact", composition: examples[2].composition }],
    });
  });
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Inspect PromoCode" }));
  fireEvent.change(screen.getByLabelText("Message the companion"), {
    target: { value: "Remove promo" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await screen.findByText("Here is a compact option.");
  fireEvent.click(screen.getByRole("button", { name: "Preview Compact" }));
  fireEvent.change(screen.getByLabelText("Message the companion"), {
    target: { value: "What changed?" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await waitFor(() => expect(sent).toHaveLength(2));
  expect(sent[1]).not.toHaveProperty("selectedId");
});

test("dismissing a draft invalidates its pending refinement", async () => {
  vi.stubEnv("VITE_AI_ENDPOINT", "https://example.test/generate");
  let calls = 0;
  let complete: (r: Response) => void = () => {};
  vi.stubGlobal("fetch", () =>
    ++calls === 1
      ? Promise.resolve(
          Response.json({
            message: "First proposal",
            options: [
              { label: "Compact", composition: examples[2].composition },
            ],
          }),
        )
      : new Promise<Response>((r) => {
          complete = r;
        }),
  );
  render(<App />);
  fireEvent.change(screen.getByLabelText("Message the companion"), {
    target: { value: "Compact please" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await screen.findByText("First proposal");
  fireEvent.click(screen.getByRole("button", { name: "Preview Compact" }));
  fireEvent.change(screen.getByLabelText("Message the companion"), {
    target: { value: "Refine this" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  complete(Response.json({ message: "Stale answer", options: [] }));
  await waitFor(() =>
    expect(
      screen.queryByText("Working with your screen and system rules…"),
    ).not.toBeInTheDocument(),
  );
  expect(screen.queryByText("Stale answer")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Promo code")).toBeInTheDocument();
});

test("retry preserves a newer unsent draft", async () => {
  vi.stubGlobal("fetch", async () =>
    Response.json({ error: "Please retry." }, { status: 503 }),
  );
  start();
  await screen.findByText("Please retry.");
  fireEvent.change(screen.getByLabelText("Message the companion"), {
    target: { value: "My next question" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Retry message" }));
  expect(screen.getByLabelText("Message the companion")).toHaveValue(
    "My next question",
  );
  await waitFor(() =>
    expect(screen.getAllByText("Please retry.")).toHaveLength(2),
  );
});
