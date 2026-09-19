import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { examples } from "../src/system/examples";

beforeEach(() => {
  vi.stubEnv("VITE_AI_ENDPOINT", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("designer workspace", () => {
  it("identifies saved examples and keeps live AI unavailable without configuration", () => {
    render(<App />);
    expect(
      screen.getByText("Saved example · not a live AI result"),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    expect(
      screen.getByRole("heading", { name: "Your order, considered." }),
    ).toBeVisible();
  });
  it("loads a different composition and restores it with undo", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Saved examples" }));
    fireEvent.click(screen.getByRole("button", { name: /Delivery first/ }));
    expect(
      screen.getByRole("button", { name: "Delivery instructions" }),
    ).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(
      screen.getByRole("button", { name: "Delivery instructions" }),
    ).toHaveAttribute("aria-expanded", "false");
  });
  it("switches only the preview to Arabic and provides a readable total", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Arabic preview" }));
    const preview = screen.getByRole("region", { name: "Order preview" });
    expect(preview).toHaveAttribute("dir", "rtl");
    expect(within(preview).getByText("طلبك، بكل عناية.")).toBeVisible();
    expect(screen.getByLabelText("Message the companion")).toBeVisible();
  });
  it("applies a demo promo once, computes the total, and labels the payment simulation", () => {
    render(<App />);
    const preview = screen.getByRole("region", { name: "Order preview" });
    fireEvent.change(within(preview).getByLabelText("Promo code"), {
      target: { value: "STUDIO10" },
    });
    fireEvent.click(within(preview).getByRole("button", { name: "Apply" }));
    // QAR 64 subtotal - QAR 6.40 (10%) + QAR 10 delivery.
    expect(within(preview).getByText("QAR 67.60")).toBeVisible();
    fireEvent.click(
      within(preview).getByRole("button", { name: /Place demo order/ }),
    );
    expect(within(preview).getByRole("status")).toHaveTextContent(
      "Demo only. No order or payment was submitted.",
    );
  });
  it("selects a preview block and shows its actual system contract", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Inspect DeliveryDetails" }),
    );
    expect(
      screen.getByRole("heading", { name: "Delivery details" }),
    ).toBeVisible();
    expect(screen.getByText("delivery-emphasis")).toBeVisible();
  });
  it("validates manual AI imports and preserves the previous composition on invalid input", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Use your own AI tool" }),
    );
    const dialog = screen.getByRole("dialog", { name: /Your AI tool/ });
    fireEvent.change(within(dialog).getByLabelText("Paste the JSON response"), {
      target: { value: '{"blocks":[]}' },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Validate & preview" }),
    );
    expect(within(dialog).getByRole("alert")).not.toBeEmptyDOMElement();
    expect(
      screen.getByRole("heading", { name: "Your order, considered." }),
    ).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("Paste the JSON response"), {
      target: { value: JSON.stringify(examples[2].composition) },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Validate & preview" }),
    );
    expect(
      screen.getByText("Imported composition · source unverified"),
    ).toBeVisible();
    expect(screen.queryByLabelText("Promo code")).not.toBeInTheDocument();
  });
  it("ignores a response arriving after the user cancels the request", async () => {
    vi.stubEnv("VITE_AI_ENDPOINT", "https://example.test/generate");
    let resolveRequest: (response: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    render(<App />);
    fireEvent.change(screen.getByLabelText("Message the companion"), {
      target: { value: "Make it compact" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel generation" }));
    resolveRequest(
      new Response(
        JSON.stringify({
          message: "A compact direction",
          options: [
            { label: "Compact result", composition: examples[2].composition },
          ],
        }),
      ),
    );
    await waitFor(() =>
      expect(
        screen.getByText("Generation cancelled. Your layout is preserved."),
      ).toBeVisible(),
    );
    expect(screen.getByLabelText("Promo code")).toBeVisible();
    expect(
      screen.getByText("Saved example · not a live AI result"),
    ).toBeVisible();
  });
  it("keeps the accepted layout when a live response violates the contract", async () => {
    vi.stubEnv("VITE_AI_ENDPOINT", "https://example.test/generate");
    vi.stubGlobal("fetch", async () => new Response('{"blocks":[]}'));
    render(<App />);
    fireEvent.change(screen.getByLabelText("Message the companion"), {
      target: { value: "Make it compact" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() =>
      expect(
        screen.getByText(/The reply did not match the conversation contract/),
      ).toBeVisible(),
    );
    expect(screen.getByLabelText("Promo code")).toBeVisible();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });
  it("preserves edits typed while generation is in flight", async () => {
    vi.stubEnv("VITE_AI_ENDPOINT", "https://example.test/generate");
    let resolveRequest: (response: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    render(<App />);
    fireEvent.change(screen.getByLabelText("Message the companion"), {
      target: { value: "Make it compact" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    fireEvent.change(screen.getByLabelText("Message the companion"), {
      target: { value: "New edits made while waiting" },
    });
    resolveRequest(
      new Response(
        JSON.stringify({
          message: "A compact direction",
          options: [
            { label: "Compact result", composition: examples[2].composition },
          ],
        }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByText("A compact direction")).toBeVisible(),
    );
    expect(screen.getByLabelText("Message the companion")).toHaveValue(
      "New edits made while waiting",
    );
  });
  it("selects the actual delivery ID in imported compositions", () => {
    const imported = structuredClone(examples[0].composition);
    imported.blocks.find((block) => block.type === "DeliveryDetails")!.id =
      "destination";
    imported.decisions.forEach((decision) => {
      if (decision.blockId === "delivery") decision.blockId = "destination";
    });
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Use your own AI tool" }),
    );
    fireEvent.change(screen.getByLabelText("Paste the JSON response"), {
      target: { value: JSON.stringify(imported) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Validate & preview" }));
    expect(
      screen.getByRole("button", { name: "Inspect DeliveryDetails" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Inspect system" }));
    expect(
      screen.getByRole("heading", { name: "Delivery details" }),
    ).toBeVisible();
  });
  it("lets the emphasized delivery instructions collapse after starting expanded", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Saved examples" }));
    fireEvent.click(screen.getByRole("button", { name: /Delivery first/ }));
    const toggle = screen.getByRole("button", {
      name: "Delivery instructions",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
  it("shows the emphasis variant token roles in the inspector", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Saved examples" }));
    fireEvent.click(screen.getByRole("button", { name: /Delivery first/ }));
    fireEvent.click(screen.getByRole("button", { name: "Inspect system" }));
    const inspector = screen.getByRole("complementary", {
      name: "System inspector",
    });
    expect(within(inspector).getByText("action.subtle")).toBeVisible();
    expect(
      within(inspector).queryByText("surface.page"),
    ).not.toBeInTheDocument();
  });
});
