import { render, screen, fireEvent } from "@testing-library/react";
import { expect, test } from "vitest";
import { TeamSection, careemTheme } from "../src/companion/TeamSection";
import {
  resolveTeamToken,
  teamSystemInstruction,
} from "../src/companion/team-system";
import { companionInstruction } from "../server/companion";

test("published Careem theme is separate from companion tokens and reaches model context", () => {
  expect(resolveTeamToken("action.primary").value).toBe("#00E784");
  expect(careemTheme.colors.buttonPrimaryFill).toBe("#00E784");
  expect(careemTheme.colors.buttonPrimaryText).toBe("#00493E");
  expect(companionInstruction).toContain(teamSystemInstruction);
});
test("real Base Web choices select independently of inspection", () => {
  let inspected = false;
  render(
    <TeamSection
      section={{
        id: "s",
        component: "Choices",
        title: "Service",
        body: "",
        emphasis: false,
        items: [
          { label: "Cleaning", detail: "QAR 160" },
          { label: "Laundry", detail: "QAR 40" },
        ],
      }}
      onInspect={() => {
        inspected = true;
      }}
    />,
  );
  const choice = screen.getByRole("radio", { name: "Laundry" });
  fireEvent.click(choice);
  expect(choice).toBeChecked();
  expect(inspected).toBe(false);
  fireEvent.click(
    screen.getByRole("button", { name: "Inspect Choices: Service" }),
  );
  expect(inspected).toBe(true);
  expect(document.querySelector('[data-baseweb="radio"]')).not.toBeNull();
});
test("real Base Web action identifies its preview boundary", () => {
  render(
    <TeamSection
      section={{
        id: "a",
        component: "Action",
        title: "Book service",
        body: "",
        emphasis: false,
        items: [],
      }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Book service" }));
  expect(screen.getByRole("status")).toHaveTextContent(
    "no booking is submitted",
  );
});

test("primary CTA text meets 4.5:1 contrast against its published green fill", () => {
  const luminance = (hex: string) => {
    const values = hex
      .slice(1)
      .match(/../g)!
      .map((s) => parseInt(s, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };
  const a = luminance(resolveTeamToken("action.primary").value);
  const b = luminance(resolveTeamToken("action.onPrimary").value);
  expect(
    (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
  ).toBeGreaterThanOrEqual(4.5);
});
