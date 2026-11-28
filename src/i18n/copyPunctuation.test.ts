import { describe, expect, it } from 'vitest';

/**
 * Auto-registers every locale JSON, same pattern as `index.ts`, so a new
 * namespace is covered without editing this file.
 */
const localeModules = import.meta.glob<{ default: unknown }>('./locales/*/*.json', {
  eager: true,
});

const FORBIDDEN_DASH = /[—–]/;

function collectDashPaths(value: unknown, path: string, acc: string[]): void {
  if (typeof value === 'string') {
    if (FORBIDDEN_DASH.test(value)) acc.push(path);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectDashPaths(item, `${path}[${index}]`, acc));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      collectDashPaths(child, `${path}.${key}`, acc);
    }
  }
}

describe('locale copy punctuation', () => {
  it('contains no em or en dashes', () => {
    const hits: string[] = [];
    for (const [file, mod] of Object.entries(localeModules)) {
      collectDashPaths(mod.default, file, hits);
    }
    expect(hits).toEqual([]);
  });
});
