/**
 * oklch(L C H) -> linear sRGB -> WCAG relative luminance -> contrast ratio.
 * Matrices from Björn Ottosson's OKLab reference implementation.
 */

export interface LinearRgb {
  r: number;
  g: number;
  b: number;
}

export function parseOklch(value: string): { l: number; c: number; h: number } {
  const match = value.match(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/
  );
  if (!match) {
    throw new Error(`Not an oklch() color: ${value}`);
  }
  return { l: Number(match[1]), c: Number(match[2]), h: Number(match[3]) };
}

export function oklchToLinearSrgb(value: string): LinearRgb {
  const { l: L, c: C, h } = parseOklch(value);
  const hRad = (h * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  };
}

export function isInSrgbGamut(rgb: LinearRgb): boolean {
  const epsilon = 1e-4;
  return [rgb.r, rgb.g, rgb.b].every(
    (channel) => channel >= -epsilon && channel <= 1 + epsilon
  );
}

function relativeLuminance(rgb: LinearRgb): number {
  return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(oklchToLinearSrgb(a));
  const lb = relativeLuminance(oklchToLinearSrgb(b));
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}
