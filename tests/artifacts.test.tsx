import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArtifactView, LayoutPreview } from "../src/companion/ArtifactView";
import type { Artifact } from "../src/companion/contract";

const sections = [
  {
    id: "heading",
    component: "Heading" as const,
    title: "Find your service",
    body: "Choose the right support.",
    items: [],
    emphasis: false,
  },
  {
    id: "total",
    component: "Summary" as const,
    title: "Your estimate",
    body: "Before you book",
    items: [{ label: "Total", detail: "QAR 140" }],
    emphasis: true,
  },
];
const layout: Artifact = {
  kind: "layout",
  title: "Choose with confidence",
  recommendation: "Compare before booking.",
  assumptions: ["Prices are estimates."],
  options: [
    {
      id: "a",
      title: "Guided steps",
      rationale: "A clear reading order.",
      tradeoff: "More scrolling.",
      family: "service-selection",
      arrangement: "stacked",
      sections,
    },
    {
      id: "b",
      title: "At a glance",
      rationale: "Keeps cost close.",
      tradeoff: "Needs horizontal room.",
      family: "booking-review",
      arrangement: "split",
      sections,
    },
  ],
};
describe("artifact workspace", () => {
  it("uses full-width comparison cards for split choices without an empty summary column", () => {
    if (layout.kind !== "layout") throw new Error("Expected layout fixture");
    const { container } = render(
      <LayoutPreview
        option={{
          ...layout.options[0],
          arrangement: "split",
          sections: [
            sections[0],
            {
              id: "services",
              component: "Choices",
              title: "Compare services",
              body: "Choose a service.",
              items: [
                { label: "Cleaning", detail: "QAR 140" },
                { label: "Deep cleaning", detail: "QAR 240" },
              ],
              emphasis: false,
            },
          ],
        }}
      />,
    );
    expect(
      container.querySelector(".av-split-comparison .av-split-main"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".av-split-summary"),
    ).not.toBeInTheDocument();
    const comparison = screen.getByRole("button", {
      name: "Inspect Choices: Compare services",
    });
    expect(
      within(comparison.closest("section")!).getByText("Cleaning"),
    ).toBeInTheDocument();
    expect(
      within(comparison.closest("section")!).getByText("Deep cleaning"),
    ).toBeInTheDocument();
  });
  it("keeps the heading before a summary-first composition", () => {
    if (layout.kind !== "layout") throw new Error("Expected layout fixture");
    render(
      <LayoutPreview
        option={{
          ...layout.options[0],
          arrangement: "summary-first",
          sections: [
            {
              id: "context",
              component: "Text",
              title: "Visit details",
              body: "Select your service.",
              items: [],
              emphasis: false,
            },
            ...sections,
          ],
        }}
      />,
    );
    expect(
      screen
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual([
      "Inspect Heading: Find your service",
      "Inspect Summary: Your estimate",
      "Inspect Text: Visit details",
    ]);
  });
  it("reflects controlled selection changes and clearing", () => {
    const { rerender } = render(
      <ArtifactView
        artifact={layout}
        selection={{ directionId: "a", sectionId: "heading", field: "title" }}
        onSelect={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Select title copy" }),
    ).toHaveAttribute("aria-pressed", "true");
    rerender(
      <ArtifactView
        artifact={layout}
        selection={{ directionId: "a", sectionId: "heading", field: "body" }}
        onSelect={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Select body copy" }),
    ).toHaveAttribute("aria-pressed", "true");
    rerender(
      <ArtifactView artifact={layout} selection={null} onSelect={() => {}} />,
    );
    expect(
      screen.queryByRole("region", { name: "Component details" }),
    ).not.toBeInTheDocument();
  });
  it("selects a real preview field and exposes the matching system reference", () => {
    let selected: unknown;
    render(
      <ArtifactView
        artifact={layout}
        onSelect={(value) => (selected = value)}
      />,
    );
    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Inspect Heading: Find your service",
      })[0],
    );
    expect(selected).toEqual({
      directionId: "a",
      sectionId: "heading",
      field: "title",
    });
    const inspector = screen.getByRole("region", { name: "Component details" });
    expect(within(inspector).getByText("text.primary")).toBeInTheDocument();
    expect(within(inspector).getByText("#001942")).toBeInTheDocument();
    expect(
      within(inspector).getByRole("link", {
        name: "Open Heading in Storybook",
      }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining("companion-components--heading"),
    );
    fireEvent.click(
      within(inspector).getByRole("button", { name: "Select body copy" }),
    );
    expect(selected).toEqual({
      directionId: "a",
      sectionId: "heading",
      field: "body",
    });
  });
  it("distinguishes excerpts from interpretation and links improvements to themes", () => {
    const artifact: Artifact = {
      kind: "feedback",
      title: "Make cost clear",
      sourceNotes: "I could not find the total.",
      themes: [
        {
          id: "cost",
          title: "Cost visibility",
          observation: "Total was hard to find.",
          quotes: ["I could not find the total."],
          interpretation: "A persistent total may help.",
        },
      ],
      improvements: [
        {
          title: "Show total sooner",
          reason: "Supports the cost concern.",
          priority: "high",
          themeIds: ["cost"],
        },
      ],
      limitations: ["One note; frequency is unknown."],
    };
    render(<ArtifactView artifact={artifact} />);
    expect(
      screen.getByText("I could not find the total.", {
        selector: "blockquote",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Interpretation")).toBeInTheDocument();
    expect(screen.getByText("Summary of notes")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Cost visibility" }),
    ).toHaveAttribute("href", expect.stringContaining("cost"));
    expect(
      screen.getByText("One note; frequency is unknown."),
    ).toBeInTheDocument();
  });
  it("chooses standalone copy without needing a layout", () => {
    let chosen = -1;
    render(
      <ArtifactView
        artifact={{
          kind: "copy",
          title: "Empty state",
          context: "No saved services",
          target: null,
          alternatives: [
            {
              text: "Find your first service",
              tone: "Warm",
              rationale: "An actionable start.",
            },
            {
              text: "Nothing saved yet",
              tone: "Direct",
              rationale: "Names the state.",
            },
            {
              text: "Your next service starts here",
              tone: "Encouraging",
              rationale: "Looks ahead.",
            },
          ],
        }}
        onChooseCopy={(index) => (chosen = index)}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Choose option 2" }));
    expect(chosen).toBe(1);
  });
  it("focuses selected copy with recoverable alternatives and disables choosing without a callback", () => {
    const copy: Artifact = {
      kind: "copy",
      title: "Copy",
      context: "A booking action",
      target: null,
      alternatives: [
        { text: "Book a visit", tone: "Direct", rationale: "Clear action." },
        {
          text: "Choose your visit",
          tone: "Warm",
          rationale: "Invites choice.",
        },
        {
          text: "Continue to booking",
          tone: "Neutral",
          rationale: "Names the next step.",
        },
      ],
    };
    const { rerender } = render(
      <ArtifactView artifact={copy} selectedCopy={1} onChooseCopy={() => {}} />,
    );
    expect(
      screen.getByRole("button", { name: "Selected copy" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Change copy" }));
    expect(
      screen.getByRole("button", { name: "Choose option 1" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Continue to booking")).toBeInTheDocument();
    rerender(<ArtifactView artifact={copy} selectedCopy={1} />);
    expect(
      screen.getByRole("button", { name: "Selected copy" }),
    ).toBeDisabled();

    expect(
      screen.getByRole("button", { name: "Choose option 1" }),
    ).toBeDisabled();
  });
});

it("focuses the chosen direction while keeping alternatives recoverable", () => {
  render(<ArtifactView artifact={layout} selectedDirection="a" />);
  expect(
    screen.getByRole("button", { name: "Change direction" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: layout.options[1].title }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Change direction" }));
  expect(
    screen.getByRole("heading", { name: layout.options[1].title }),
  ).toBeInTheDocument();
});
