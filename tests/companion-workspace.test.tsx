import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, test, expect, vi } from "vitest";
import CompanionApp from "../src/companion/CompanionApp";
import { sendCompanion } from "../src/companion/client";
vi.mock("../src/companion/client", () => ({ sendCompanion: vi.fn() }));
import { startSession, readSession } from "../src/companion/session";
vi.mock("../src/companion/session", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/companion/session")>();
  return { ...actual, startSession: vi.fn(actual.startSession) };
});
const send = vi.mocked(sendCompanion);
const copy = {
  kind: "copy",
  title: "Payment error",
  context: "No charge was made.",
  target: null,
  alternatives: [
    {
      text: "Your payment did not go through. Try again.",
      tone: "Direct",
      rationale: "States the outcome.",
    },
    {
      text: "We could not complete your payment. Choose another method.",
      tone: "Helpful",
      rationale: "Offers recovery.",
    },
    {
      text: "Payment unsuccessful. Your card was not charged.",
      tone: "Reassuring",
      rationale: "Reduces uncertainty.",
    },
  ],
} as const;
beforeEach(() => {
  localStorage.clear();
  send.mockReset();
  vi.mocked(startSession).mockClear();
  vi.stubEnv("VITE_AI_ENDPOINT", "https://example.test/companion");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function submit(text: string) {
  fireEvent.change(screen.getByLabelText("Message the companion"), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
}
test("offers three equal tools and generates copy without a layout", async () => {
  send.mockResolvedValue({
    message: "Here are three recovery messages.",
    artifact: structuredClone(copy),
  } as never);
  render(<CompanionApp />);
  expect(
    screen.getByRole("button", { name: "Brainstorm layouts" }),
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Summarize feedback" }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Write UI copy" }));
  submit("Write a failed payment message. No charge was made.");
  await screen.findByText(copy.alternatives[0].text);
  expect(send.mock.calls[0][1]).toMatchObject({ tool: "copy" });
  expect(send.mock.calls[0][1].current).toBeUndefined();
});
test("retries the failed tool and preserves a newer unsent draft", async () => {
  send
    .mockRejectedValueOnce(new Error("Free quota reached."))
    .mockResolvedValueOnce({
      message: "Done.",
      artifact: structuredClone(copy),
    } as never);
  render(<CompanionApp />);
  fireEvent.click(screen.getByRole("button", { name: "Write UI copy" }));
  submit("Write a payment error.");
  await screen.findByText("Free quota reached.");
  fireEvent.change(screen.getByLabelText("Message the companion"), {
    target: { value: "Keep this next idea" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Retry message" }));
  await screen.findByText("Done.");
  expect(screen.getByLabelText("Message the companion")).toHaveValue(
    "Keep this next idea",
  );
});
test("opening again starts fresh without restoring conversation, result or draft", async () => {
  send.mockResolvedValue({
    message: "Ready for review.",
    artifact: structuredClone(copy),
  } as never);
  const view = render(<CompanionApp />);
  fireEvent.click(screen.getByRole("button", { name: "Write UI copy" }));
  submit("Write a payment error.");
  await screen.findByText("Ready for review.");
  fireEvent.change(screen.getByLabelText("Message the companion"), {
    target: { value: "Make it warmer" },
  });
  await waitFor(() =>
    expect(localStorage.getItem("form-intent-session-v2")).toContain(
      "Make it warmer",
    ),
  );
  view.unmount();
  render(<CompanionApp />);
  expect(screen.getByLabelText("Message the companion")).toHaveValue("");
  expect(screen.queryByText("Ready for review.")).not.toBeInTheDocument();
  expect(screen.queryByText(copy.alternatives[0].text)).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Brainstorm layouts" }),
  ).toBeVisible();
});
test("feedback sends supplied notes as evidence without needing a design", async () => {
  send.mockResolvedValue({
    message: "Please add more context.",
    artifact: null,
  });
  render(<CompanionApp />);
  fireEvent.click(screen.getByRole("button", { name: "Summarize feedback" }));
  submit("P1: I could not find the delivery fee.");
  await screen.findByText("Please add more context.");
  expect(send.mock.calls[0][1]).toMatchObject({
    tool: "feedback",
    sourceNotes: "P1: I could not find the delivery fee.",
  });
});

const layout = {
  kind: "layout",
  title: "Service selection",
  recommendation: "Compare plans",
  assumptions: [],
  options: ["stacked", "split"].map((arrangement, i) => ({
    id: `d${i}`,
    title: `Direction ${i + 1}`,
    rationale: "Compare the plans",
    tradeoff: "More information",
    family: "service-selection",
    arrangement,
    sections: [
      {
        id: "heading",
        component: "Heading",
        title: "Choose a clean",
        body: "Compare your plans",
        items: [],
        emphasis: false,
      },
    ],
  })),
};
function seed(extra: Record<string, unknown>) {
  localStorage.setItem(
    "form-intent-session-v2",
    JSON.stringify({
      version: 2,
      tool: "layout",
      draft: "",
      messages: [],
      sourceNotes: "",
      revisions: [],
      ...extra,
    }),
  );
  vi.mocked(startSession).mockReturnValueOnce(readSession());
}
test("changing direction commits the choice without a second acceptance", () => {
  seed({
    result: layout,
    accepted: layout,
    layout,
    selectedDirection: "d0",
    acceptedDirection: "d0",
  });
  render(<CompanionApp />);
  expect(screen.getByText(layout.title)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Change direction" }));
  fireEvent.click(screen.getByRole("button", { name: "Choose direction 2" }));
  expect(
    screen.queryByRole("button", { name: "Accept direction" }),
  ).not.toBeInTheDocument();
  expect(screen.getByText(layout.title)).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Choose direction 1" }),
  ).not.toBeInTheDocument();
});
test("standalone copy selection stays selected during the conversation", () => {
  seed({ tool: "copy", result: copy });
  const view = render(<CompanionApp />);
  fireEvent.click(screen.getByRole("button", { name: "Choose option 2" }));
  expect(screen.getByRole("button", { name: "Selected copy" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(
    JSON.parse(localStorage.getItem("form-intent-session-v2")!).selectedCopy,
  ).toBe(1);
});
test("historical targeted copy cannot modify a different layout with reused IDs", () => {
  const newer = structuredClone(layout);
  newer.options[0].sections[0].title = "A different service";
  const targeted = {
    ...copy,
    target: { directionId: "d0", sectionId: "heading", field: "title" },
  };
  seed({
    result: newer,
    accepted: newer,
    layout: newer,
    selectedDirection: "d0",
    messages: [
      {
        id: "old-copy",
        role: "assistant",
        tool: "copy",
        text: "Older proposal",
        artifact: targeted,
        layoutContext: layout,
      },
    ],
  });
  render(<CompanionApp />);
  fireEvent.click(screen.getByRole("button", { name: "Payment error" }));
  fireEvent.click(screen.getByRole("button", { name: "Choose option 1" }));
  expect(screen.getByRole("status")).toHaveTextContent(
    "This copy was written for an earlier layout",
  );
  expect(
    JSON.parse(localStorage.getItem("form-intent-session-v2")!).layout
      .options[0].sections[0].title,
  ).toBe("A different service");
});
test("reopening accepted copy retains its chosen alternative for export", () => {
  seed({
    tool: "copy",
    result: copy,
    accepted: copy,
    selectedCopy: 1,
    acceptedCopy: 1,
    messages: [
      {
        id: "copy-result",
        role: "assistant",
        text: "Copy ready.",
        tool: "copy",
        artifact: copy,
      },
    ],
  });
  render(<CompanionApp />);
  fireEvent.click(screen.getByRole("button", { name: "Payment error" }));
  expect(screen.getByRole("button", { name: "Selected copy" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(
    JSON.parse(localStorage.getItem("form-intent-session-v2")!).selectedCopy,
  ).toBe(1);
});

test("copy export contains the selected wording, not the full option set", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
  seed({
    tool: "copy",
    result: copy,
    accepted: copy,
    selectedCopy: 1,
    acceptedCopy: 1,
  });
  render(<CompanionApp />);
  fireEvent.click(screen.getByRole("button", { name: "Copy result as text" }));
  await screen.findByText("Result copied as text.");
  expect(writeText).toHaveBeenCalledWith(copy.alternatives[1].text);
});
test.each([
  ["layout", layout, { selectedDirection: "d1" }, "selectedDirection", "d1"],
  ["copy", copy, { selectedCopy: 1 }, "selectedCopy", 1],
])(
  "sends the chosen %s option as follow-up context",
  async (tool, artifact, selection, key, value) => {
    seed({ tool, result: artifact, ...selection });
    send.mockResolvedValue({
      message: "I understand your chosen option.",
      artifact: null,
    });
    render(<CompanionApp />);
    submit("Refine the selected option.");
    await screen.findByText("I understand your chosen option.");
    expect(send.mock.calls[0][1]).toHaveProperty(key as string, value);
  },
);

test("next copy action stages a draft and sends the chosen copy context", async () => {
  seed({
    tool: "copy",
    result: copy,
    accepted: copy,
    selectedCopy: 1,
    acceptedCopy: 1,
  });
  send.mockResolvedValue({
    message: "Refined",
    artifact: structuredClone(copy),
  } as never);
  render(<CompanionApp />);
  fireEvent.click(screen.getByRole("button", { name: "Make it shorter" }));
  expect(send).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Message the companion")).toHaveValue(
    "Shorten the selected copy without changing its meaning or losing essential information.",
  );
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await waitFor(() => expect(send).toHaveBeenCalled());
  expect(send.mock.calls[0][1]).toMatchObject({
    tool: "copy",
    selectedCopy: 1,
    current: { kind: "copy" },
  });
});

test("catalog opens with actual components and resolves semantic token values", () => {
  render(<CompanionApp />);
  fireEvent.click(
    screen.getByRole("button", { name: "Design system Careem-inspired v1.0" }),
  );
  expect(
    screen.getByRole("dialog", { name: "Design system catalog" }),
  ).toBeVisible();
  expect(
    screen.getByRole("combobox", { name: "Active design system" }),
  ).toHaveValue("careem-baseweb-demo-v1");
  expect(
    screen.getAllByRole("link", { name: "Open Storybook ↗" }),
  ).toHaveLength(5);
  fireEvent.click(screen.getByRole("button", { name: "Tokens · 17" }));
  expect(screen.getByRole("heading", { name: "action.primary" })).toBeVisible();
  expect(screen.getAllByText("#00E784").length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: "Close catalog" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("write its copy starts a new conversation targeting the chosen layout heading", async () => {
  seed({
    tool: "layout",
    result: layout,
    accepted: layout,
    layout,
    selectedDirection: "d1",
    acceptedDirection: "d1",
  });
  send.mockResolvedValue({ message: "Ready", artifact: null });
  render(<CompanionApp />);
  fireEvent.click(screen.getByRole("button", { name: "Write its copy" }));
  expect(screen.getByLabelText("Conversation task")).toHaveTextContent(
    "UI copy",
  );
  expect(screen.getByText(/New UI copy conversation/)).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Brainstorm layouts" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await waitFor(() => expect(send).toHaveBeenCalled());
  expect(send.mock.calls[0][1]).toMatchObject({
    tool: "copy",
    selectedDirection: "d1",
    selection: { directionId: "d1", field: "title" },
  });
});

test("locks the conversation tool after the first submitted message, including errors", async () => {
  send.mockRejectedValueOnce(new Error("Free quota reached."));
  const view = render(<CompanionApp />);
  fireEvent.click(screen.getByRole("button", { name: "Write UI copy" }));
  submit("Write a payment error.");
  await screen.findByText("Free quota reached.");
  expect(
    screen.queryByRole("button", { name: "Brainstorm layouts" }),
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText("Conversation task")).toHaveTextContent(
    "UI copy",
  );
  view.unmount();
  render(<CompanionApp />);
  expect(
    screen.getByRole("button", { name: "Summarize feedback" }),
  ).toBeVisible();
});

test("preview controls keep the artifact intact and details out of the canvas", () => {
  seed({ result: layout, layout, selectedDirection: "d0" });
  const { container } = render(<CompanionApp />);
  expect(screen.queryByText("Working assumptions")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Mobile" }));
  expect(container.querySelector(".av-design-canvas")).toHaveAttribute(
    "data-viewport",
    "mobile",
  );
  expect(screen.getByRole("heading", { name: "Choose a clean" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Design details" }));
  expect(screen.getByLabelText("Design details")).toHaveTextContent(
    "Working assumptions",
  );
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByLabelText("Design details")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Desktop" }));
  expect(container.querySelector(".av-design-canvas")).toHaveAttribute(
    "data-viewport",
    "desktop",
  );
});

test("quick messages stage editable drafts without sending or locking the tool", () => {
  render(<CompanionApp />);
  fireEvent.click(
    screen.getByRole("button", { name: "Compare service plans" }),
  );
  expect(
    (screen.getByLabelText("Message the companion") as HTMLTextAreaElement)
      .value,
  ).toContain("QAR 160");
  expect(send).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Write UI copy" }));
  expect(
    screen.getByRole("button", { name: "Explain a failed payment" }),
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Compare service plans" }),
  ).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Clarify the next action" }),
  );
  expect(
    (screen.getByLabelText("Message the companion") as HTMLTextAreaElement)
      .value,
  ).toContain("does not confirm or charge");
  expect(send).not.toHaveBeenCalled();
});

test("Arabic is fetched once and English restores the original design", async () => {
  const arabic = structuredClone(layout);
  arabic.options.forEach((o) => {
    o.sections[0].title = "اختر الخدمة";
  });
  seed({ result: layout, layout, selectedDirection: "d0" });
  send.mockResolvedValue({ message: "Translated", artifact: arabic } as never);
  render(<CompanionApp />);
  fireEvent.click(screen.getByRole("button", { name: "العربية" }));
  await screen.findByRole("heading", { name: "اختر الخدمة" });
  expect(send.mock.calls[0][1]).toMatchObject({
    operation: "translate",
    current: layout,
  });
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(screen.getByRole("heading", { name: "Choose a clean" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "العربية" }));
  expect(screen.getByRole("heading", { name: "اختر الخدمة" })).toBeVisible();
  expect(send).toHaveBeenCalledTimes(1);
});

test("sent screenshots move from composer to message and stay out of storage", async () => {
  const image = { mimeType: "image/png", data: "iVBORw0KGgo=" };
  const prepare = await import("../src/companion/image");
  vi.spyOn(prepare, "prepareScreenshot").mockResolvedValue(image as never);
  send.mockResolvedValue({ message: "Audit ready", artifact: null });
  render(<CompanionApp />);
  fireEvent.click(screen.getByRole("button", { name: "Summarize feedback" }));
  expect(
    screen.getByRole("button", { name: "Attach screenshot" }),
  ).toBeVisible();
  fireEvent.change(screen.getByLabelText("Upload screenshot"), {
    target: {
      files: [new File(["dummy"], "screen.png", { type: "image/png" })],
    },
  });
  await screen.findByAltText("Screen ready to attach");
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await screen.findByText("Audit ready");
  expect(screen.getByAltText("Attached screen")).toBeVisible();
  expect(
    screen.queryByAltText("Screen ready to attach"),
  ).not.toBeInTheDocument();
  expect(localStorage.getItem("form-intent-session-v2")).not.toContain(
    image.data,
  );
  expect(send.mock.calls[0][1].image).toEqual(image);
  submit("Explain the main issue");
  await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
  expect(send.mock.calls[1][1].image).toEqual(image);
  vi.restoreAllMocks();
});

test("pasted and dropped screens use the image pipeline and open an enlarged preview", async () => {
  const prepare = await import("../src/companion/image");
  const convert = vi
    .spyOn(prepare, "prepareScreenshot")
    .mockResolvedValue({ mimeType: "image/png", data: "iVBORw0KGgo=" });
  send.mockResolvedValue({ message: "Ready", artifact: null });
  render(<CompanionApp />);
  expect(screen.queryByText("Use sample")).not.toBeInTheDocument();
  expect(screen.queryByText("Try a sample brief")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Summarize feedback" }));
  const field = screen.getByLabelText("Message the companion");
  const file = new File(["image"], "screen.png", { type: "image/png" });
  fireEvent.paste(field, {
    clipboardData: { items: [{ kind: "file", getAsFile: () => file }] },
  });
  await screen.findByAltText("Screen ready to attach");
  expect(field).toHaveAttribute("placeholder", "Ask about this screen…");
  fireEvent.click(screen.getByRole("button", { name: "Remove screenshot" }));
  fireEvent.drop(field, { dataTransfer: { files: [file], types: ["Files"] } });
  await screen.findByAltText("Screen ready to attach");
  expect(convert).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  await screen.findByText("Ready");
  fireEvent.click(
    screen.getByRole("button", { name: "Enlarge attached screen" }),
  );
  expect(
    screen.getByRole("dialog", { name: "Attached screen preview" }),
  ).toBeVisible();
  expect(screen.getByAltText("Enlarged attached screen")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Close image preview" }));
  vi.restoreAllMocks();
});

test("an incoming response does not pull the reader away from older messages", async () => {
  let resolve!: (value: any) => void;
  send.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  render(<CompanionApp />);
  submit("Compare plans");
  const log = screen.getByRole("log");
  const scroll = vi.fn();
  Object.defineProperties(log, {
    scrollHeight: { value: 1200, configurable: true },
    clientHeight: { value: 300, configurable: true },
    scrollTop: { value: 100, writable: true, configurable: true },
    scrollTo: { value: scroll, configurable: true },
  });
  fireEvent.scroll(log);
  resolve({ message: "Here is the answer.", artifact: null });
  await screen.findByText("Here is the answer.");
  expect(scroll).not.toHaveBeenCalled();
  fireEvent.click(
    await screen.findByRole("button", { name: "New response ↓" }),
  );
  expect(scroll).toHaveBeenCalledWith({ top: 1200, behavior: "smooth" });
});
