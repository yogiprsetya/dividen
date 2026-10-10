import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  isInSrgbGamut,
  oklchToLinearSrgb,
} from "../test/helpers/contrast";

const globalsCss = readFileSync(
  path.join(__dirname, "globals.css"),
  "utf-8"
);

function extractThemeBlock(css: string, theme: "light" | "dark"): string {
  if (theme === "light") {
    const match = css.match(/:root\s*{([^}]*)}/);
    if (!match) throw new Error(":root block not found");
    return match[1];
  }
  const match = css.match(/\.dark\s*{([^}]*)}/);
  if (!match) throw new Error(".dark block not found");
  return match[1];
}

function extractToken(block: string, name: string): string {
  const match = block.match(new RegExp(`--${name}:\\s*(oklch\\([^;]*\\))`));
  if (!match) {
    throw new Error(`--${name} not declared in this theme block`);
  }
  return match[1].trim();
}

const statusTokens = ["success", "warning", "danger"] as const;
const chartTokens = ["chart-1", "chart-2", "chart-3"] as const;

describe.each(["light", "dark"] as const)("theme: %s", (theme) => {
  const block = extractThemeBlock(globalsCss, theme);
  const background = extractToken(block, "background");

  it.each(statusTokens)("--%s meets AA (>=4.5:1) against background", (name) => {
    const token = extractToken(block, name);
    expect(isInSrgbGamut(oklchToLinearSrgb(token))).toBe(true);
    expect(contrastRatio(token, background)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(chartTokens)("--%s meets non-text floor (>=3:1) against background", (name) => {
    const token = extractToken(block, name);
    expect(isInSrgbGamut(oklchToLinearSrgb(token))).toBe(true);
    expect(contrastRatio(token, background)).toBeGreaterThanOrEqual(3);
  });
});

describe("token declaration symmetry", () => {
  const lightBlock = extractThemeBlock(globalsCss, "light");
  const darkBlock = extractThemeBlock(globalsCss, "dark");

  it.each([...statusTokens, ...chartTokens])(
    "--%s is declared in both :root and .dark",
    (name) => {
      expect(() => extractToken(lightBlock, name)).not.toThrow();
      expect(() => extractToken(darkBlock, name)).not.toThrow();
    }
  );
});
