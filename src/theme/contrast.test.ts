import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { colors } from './colors';
import { contrastRatio } from './contrast';

const root = resolve(process.cwd(), 'src');

function readCss(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

function rootTokens(css: string): Record<string, string> {
  const block = css.match(/:root\s*\{([^}]+)\}/)?.[1];
  if (!block) throw new Error('global.css has no :root block');
  const tokens: Record<string, string> = {};
  for (const match of block.matchAll(/--([\w-]+)\s*:\s*([^;]+)/g)) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

function ruleBody(css: string, selector: string): string {
  const bodies: string[] = [];
  for (const match of css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
    const selectors = match[1].replace(/\/\*[\s\S]*?\*\//g, '').split(',').map((part) => part.trim());
    if (selectors.includes(selector)) bodies.push(match[2]);
  }
  if (bodies.length === 0) throw new Error(`missing rule ${selector}`);
  return bodies.join('\n');
}

function declaration(body: string, property: string): string {
  const match = body.match(new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, 'm'));
  if (!match) throw new Error(`missing ${property}`);
  return match[1].trim();
}

function resolveColor(value: string, tokens: Record<string, string>): string {
  const reference = value.match(/var\(--([\w-]+)(?:,\s*([^)]+))?\)/);
  if (reference) {
    const next = tokens[reference[1]] ?? reference[2]?.trim();
    if (!next) throw new Error(`unresolved ${value}`);
    return resolveColor(next, tokens);
  }
  const hex = value.match(/#[0-9a-fA-F]{3,8}/);
  if (!hex) throw new Error(`no color in ${value}`);
  return hex[0];
}

describe('shipped theme contrast', () => {
  const tokens = rootTokens(readCss('theme/global.css'));
  const button = readCss('components/ui/Button.module.css');
  const input = readCss('components/ui/Input.module.css');

  it('keeps colors.ts on the same hex values the stylesheet applies', () => {
    expect(colors.bg).toBe(tokens.bg);
    expect(colors.bg2).toBe(tokens.bg2);
    expect(colors.bg3).toBe(tokens.bg3);
    expect(colors.text).toBe(tokens.text);
    expect(colors.text2).toBe(tokens.text2);
    expect(colors.text3).toBe(tokens.text3);
    expect(colors.orange).toBe(tokens.orange);
    expect(colors.orangeDim).toBe(tokens['orange-dim']);
    expect(colors.buttonTextOnOrange).toBe(tokens['button-text-on-orange']);
    expect(colors.borderControl).toBe(tokens['border-control']);
    expect(colors.chart4).toBe(tokens.chart4);
  });

  it('clears 4.5:1 for muted text on soot, raised, and field', () => {
    expect(tokens.bg).toBe('#14110f');
    expect(tokens.bg2).toBe('#1a1714');
    expect(tokens.bg3).toBe('#221e1a');
    for (const ground of [tokens.bg, tokens.bg2, tokens.bg3]) {
      expect(contrastRatio(tokens.text3, ground)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('clears 4.5:1 for primary hover text and for orange-dim text links', () => {
    const label = resolveColor(declaration(ruleBody(button, '.primary'), 'color'), tokens);
    const hoverGround = resolveColor(
      declaration(ruleBody(button, '.primary:hover:not(:disabled)'), 'background-color'),
      tokens,
    );
    expect(contrastRatio(label, hoverGround)).toBeGreaterThanOrEqual(4.5);

    const cssFiles = readCss('pages/LoginPage.module.css');
    for (const match of cssFiles.matchAll(/color:\s*([^;]+);/g)) {
      const raw = match[1].trim();
      if (!raw.includes('orange-dim') && !/^#b85a14$/i.test(raw)) continue;
      expect(contrastRatio(resolveColor(raw, tokens), tokens.bg)).toBeGreaterThanOrEqual(4.5);
    }
    expect(cssFiles).toMatch(/color:\s*var\(--orange-dim\)/);
  });

  it('clears 3:1 for the border that identifies an input and a secondary button', () => {
    const field = ruleBody(input, '.input');
    const fieldBorder = resolveColor(declaration(field, 'border'), tokens);
    const fieldGround = resolveColor(declaration(field, 'background-color'), tokens);
    expect(contrastRatio(fieldBorder, fieldGround)).toBeGreaterThanOrEqual(3);

    const secondary = ruleBody(button, '.secondary');
    const secondaryBorder = resolveColor(declaration(secondary, 'border'), tokens);
    expect(contrastRatio(secondaryBorder, tokens.bg)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(secondaryBorder, tokens.bg2)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(resolveColor(declaration(secondary, 'color'), tokens), tokens.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps signal orange off body copy and chart umber visible on soot', () => {
    expect(tokens.orange).toBe('#ff7a1a');
    expect(tokens.text).not.toBe(tokens.orange);
    expect(tokens.text2).not.toBe(tokens.orange);
    expect(tokens.text3).not.toBe(tokens.orange);
    expect(tokens.chart4.toLowerCase()).not.toBe('#5a4a3a');
    expect(contrastRatio(tokens.chart4, tokens.bg)).toBeGreaterThanOrEqual(3);
  });
});
