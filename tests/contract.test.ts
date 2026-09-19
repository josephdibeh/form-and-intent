import { describe, expect, it } from "vitest";
import { validateComposition, resolveToken } from "../src/system/contract";
import { examples } from "../src/system/examples";

describe("composition boundary", () => {
  it("accepts all supplied examples and preserves their content through JSON export", () => {
    for (const example of examples) {
      const result = validateComposition(
        JSON.parse(JSON.stringify(example.composition)),
      );
      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toEqual(example.composition);
    }
  });
  it("rejects unknown components, props, variants, and obsolete versions", () => {
    for (const change of [
      (x: any) => {
        x.blocks[0].type = "InteractiveMap";
      },
      (x: any) => {
        x.blocks[0].style = { color: "red" };
      },
      (x: any) => {
        x.blocks[1].variant = "neon";
      },
      (x: any) => {
        x.catalogVersion = "0.0.0";
      },
    ]) {
      const input = structuredClone(examples[0].composition);
      change(input);
      expect(validateComposition(input).success).toBe(false);
    }
  });
  it("rejects duplicate IDs, missing mandatory blocks, and invalid rationale references", () => {
    for (const change of [
      (x: any) => {
        x.blocks[1].id = x.blocks[0].id;
      },
      (x: any) => {
        x.blocks.pop();
      },
      (x: any) => {
        x.decisions[0].rule = "invented-rule";
      },
      (x: any) => {
        x.decisions[0].blockId = "missing-block";
      },
    ]) {
      const input = structuredClone(examples[0].composition);
      change(input);
      expect(validateComposition(input).success).toBe(false);
    }
  });
  it("rejects excessive copy and payload sizes", () => {
    const input = structuredClone(examples[0].composition);
    input.title.en = "a".repeat(501);
    expect(validateComposition(input).success).toBe(false);
    expect(validateComposition({ content: "a".repeat(40_000) }).success).toBe(
      false,
    );
  });
  it("keeps action and success roles distinct even when their raw values coincide", () => {
    const references = { "color.ink": "#202820", "color.orange": "#202820" };
    expect(resolveToken("action.primary", references).reference).toBe(
      "color.orange",
    );
    expect(resolveToken("status.success", references).reference).toBe(
      "color.ink",
    );
    expect(resolveToken("action.primary", references).value).toBe(
      resolveToken("status.success", references).value,
    );
  });
  it("keeps the defined normal-text pairs above 4.5:1 contrast", () => {
    const luminance = (hex: string) => {
      const rgb = [1, 3, 5]
        .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
        .map((value) =>
          value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
        );
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    };
    for (const [foreground, background] of [
      ["text.primary", "surface.page"],
      ["text.secondary", "surface.canvas"],
      ["text.secondary", "surface.page"],
      ["action.onPrimary", "action.primary"],
    ]) {
      const [dark, light] = [foreground, background]
        .map((role) => luminance(resolveToken(role).value))
        .sort((a, b) => a - b);
      expect((light + 0.05) / (dark + 0.05)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
