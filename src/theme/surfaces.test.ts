import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

const src = resolve(process.cwd(), 'src');

function readCss(relativePath: string): string {
  return readFileSync(resolve(src, relativePath), 'utf8');
}

function walkCss(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) files.push(...walkCss(path));
    else if (entry.endsWith('.css')) files.push(path);
  }
  return files;
}

function reducedMotionBlocks(css: string): string[] {
  const blocks: string[] = [];
  const needle = '@media (prefers-reduced-motion: reduce)';
  let from = 0;
  while (from < css.length) {
    const start = css.indexOf(needle, from);
    if (start < 0) break;
    const open = css.indexOf('{', start);
    let depth = 0;
    let end = -1;
    for (let index = open; index < css.length; index += 1) {
      if (css[index] === '{') depth += 1;
      else if (css[index] === '}') {
        depth -= 1;
        if (depth === 0) {
          end = index;
          break;
        }
      }
    }
    if (end < 0) throw new Error('unclosed prefers-reduced-motion block');
    blocks.push(css.slice(open + 1, end));
    from = end + 1;
  }
  return blocks;
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

function rootTokens(css: string): Record<string, string> {
  const block = css.match(/:root\s*\{([^}]+)\}/)?.[1] ?? '';
  const tokens: Record<string, string> = {};
  for (const match of block.matchAll(/--([\w-]+)\s*:\s*([^;]+)/g)) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

function stripBalanced(css: string, start: number): { end: number; inner: string } {
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let index = open; index < css.length; index += 1) {
    if (css[index] === '{') depth += 1;
    else if (css[index] === '}') {
      depth -= 1;
      if (depth === 0) return { end: index, inner: css.slice(open + 1, index) };
    }
  }
  throw new Error('unclosed block');
}

function stripBlocks(css: string, starts: (source: string) => number): string {
  let rest = css;
  let from = 0;
  while (from < rest.length) {
    const start = starts(rest.slice(from));
    if (start < 0) break;
    const absolute = from + start;
    const { end } = stripBalanced(rest, absolute);
    rest = rest.slice(0, absolute) + rest.slice(end + 1);
    from = absolute;
  }
  return rest;
}

function baseRules(css: string): string {
  const withoutKeyframes = stripBlocks(css, (source) => source.search(/@keyframes\b/));
  return stripBlocks(withoutKeyframes, (source) => source.indexOf('@media (prefers-reduced-motion: reduce)'));
}

function hiddenEntranceSelectors(css: string): string[] {
  const selectors: string[] = [];
  for (const match of baseRules(css).matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
    const body = match[2];
    if (!/opacity:\s*0\s*;/.test(body) || !/animation\s*:/.test(body)) continue;
    for (const part of match[1].replace(/\/\*[\s\S]*?\*\//g, '').split(',')) {
      const selector = part.trim();
      if (selector) selectors.push(selector);
    }
  }
  return selectors;
}

function mentionsSelector(block: string, selector: string): boolean {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`${escaped}(?![\\w-])`).test(block);
}

describe('shipped surface constraints', () => {
  it('stops voice, skeleton, privacy, and toast motion under reduced motion', () => {
    const voice = reducedMotionBlocks(readCss('pages/VoicePage.module.css')).join('\n');
    expect(voice).toMatch(/\.statusDotActive/);
    expect(voice).toMatch(/\.barActive/);
    expect(voice).toMatch(/animation:\s*none/);

    const skeleton = reducedMotionBlocks(readCss('components/ui/Skeleton.module.css')).join('\n');
    expect(skeleton).toMatch(/\.skeleton/);
    expect(skeleton).toMatch(/animation:\s*none/);

    const privacy = reducedMotionBlocks(readCss('pages/PrivacyPage.module.css')).join('\n');
    expect(privacy).toMatch(/\.header/);
    expect(privacy).toMatch(/\.article/);
    expect(privacy).toMatch(/animation:\s*none/);
    expect(privacy).toMatch(/opacity:\s*1/);

    const toast = reducedMotionBlocks(readCss('components/ui/Toast.module.css')).join('\n');
    expect(toast).toMatch(/\.toast/);
    expect(toast).toMatch(/animation:\s*none/);
  });

  it('resets an opacity-0 entrance when reduced motion cancels the animation', () => {
    for (const file of walkCss(src)) {
      const css = readFileSync(file, 'utf8');
      const blocks = reducedMotionBlocks(css);
      for (const selector of hiddenEntranceSelectors(css)) {
        const block = blocks.find((candidate) => mentionsSelector(candidate, selector));
        expect(block, `${file} ${selector}`).toBeTruthy();
        expect(block, `${file} ${selector}`).toMatch(/opacity:\s*1/);
      }
    }
  });

  it('drops 9px type, hazard yellow, and the undefined danger red', () => {
    for (const file of walkCss(src)) {
      const css = readFileSync(file, 'utf8');
      expect(css, file).not.toMatch(/font-size:\s*9px/);
      expect(css, file).not.toMatch(/#ffcc00/i);
      expect(css, file).not.toMatch(/#ffeb00/i);
      expect(css, file).not.toMatch(/#ff5a36/i);
    }
  });

  it('gives the switch a 24px target and the icon-only sidebar a 3:1 icon', () => {
    const track = ruleBody(readCss('components/ui/Switch.module.css'), '.track');
    const width = Number(track.match(/width:\s*(\d+)px/)?.[1]);
    const height = Number(track.match(/height:\s*(\d+)px/)?.[1]);
    expect(width).toBeGreaterThanOrEqual(24);
    expect(height).toBeGreaterThanOrEqual(24);

    const tokens = rootTokens(readCss('theme/global.css'));
    const icon = ruleBody(readCss('components/layout/Sidebar.module.css'), '.icon');
    expect(icon).toMatch(/color:\s*var\(--text3\)/);
    expect(contrastRatio(tokens.text3, tokens.bg2)).toBeGreaterThanOrEqual(3);
  });
});
