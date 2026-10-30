function srgbChannel(hex: string, index: number): number {
  const value = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
  if (value <= 0.04045) return value / 12.92;
  return ((value + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance for a #rgb or #rrggbb color. */
export function relativeLuminance(color: string): number {
  const raw = color.trim().replace(/^#/, '');
  const hex = raw.length === 3 ? raw.split('').map((channel) => channel + channel).join('') : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error(`contrast expects a hex color, got ${color}`);
  }
  return (
    0.2126 * srgbChannel(hex, 0) +
    0.7152 * srgbChannel(hex, 2) +
    0.0722 * srgbChannel(hex, 4)
  );
}

/** WCAG 2 contrast ratio between two hex colors. */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}
