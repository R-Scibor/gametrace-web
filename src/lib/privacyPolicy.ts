/** Version stamp for the published notice. Mobile stores the accepted value and
 *  re-prompts when it changes, so bump this whenever the substance changes. */
export const PRIVACY_POLICY_VERSION = '1.0';

/** ISO date the current version took effect. Deliberately exported even though
 *  nothing in `src/` reads it yet: the mobile Accept flow stamps it alongside
 *  the accepted version (cross-repo handoff is tracked separately). Keep it in
 *  step with the human-readable `lastUpdated` string in both locales; a test
 *  asserts they cannot drift apart. */
export const PRIVACY_POLICY_EFFECTIVE_DATE = '2026-08-11';

/** Public contact for official-host privacy questions. Lives here rather than in
 *  PrivacyPage so the validator can interpolate it without importing a page
 *  component (which would be a cycle). PrivacyPage re-exports it for the
 *  modules that already import it from there. */
export const PRIVACY_CONTACT_EMAIL = 'sciborr08@gmail.com';

/** Ids the notice must always contain. `account-deletion` is an external
 *  contract: the Discord bot links to it through GAMETRACE_PRIVACY_URL, and
 *  DeleteAccountPage points at it too. Renaming it breaks inbound links. */
export const REQUIRED_SECTION_IDS = [
  'scope',
  'controller',
  'what-we-do',
  'data',
  'sources',
  'purposes',
  'voice',
  'client-storage',
  'recipients',
  'no-sale',
  'transfers',
  'retention',
  'account-deletion',
  'rights',
  'children',
  'security',
  'changes',
] as const;

export interface PolicyLink {
  label: string;
  href: string;
}

export type PolicyBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'note'; text: string }
  | { type: 'links'; items: PolicyLink[] };

export interface PolicySection {
  id: string;
  title: string;
  blocks: PolicyBlock[];
}

type Vars = Record<string, string | number>;

/** Only absolute https URLs and site-root-relative paths. Blocks `javascript:`
 *  and friends, and rejects protocol-relative `//host` which would otherwise
 *  slip past a naive startsWith('/') check. */
export function isSafeHref(href: string): boolean {
  if (typeof href !== 'string' || href.length === 0) return false;
  if (href.startsWith('//')) return false;
  if (href.startsWith('/')) return true;
  return href.startsWith('https://');
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((item) => typeof item === 'string');

/** Replaces `{{key}}` with a supplied value. Unknown placeholders are left as
 *  written so a missing var is visible in review rather than silently blank. */
function interpolate(text: string, vars: Vars): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

function parseBlock(raw: unknown, vars: Vars): PolicyBlock | null {
  if (!isRecord(raw)) return null;

  switch (raw.type) {
    case 'p':
    case 'note': {
      if (typeof raw.text !== 'string') return null;
      return { type: raw.type, text: interpolate(raw.text, vars) };
    }
    case 'ul': {
      if (!isStringArray(raw.items) || raw.items.length === 0) return null;
      return { type: 'ul', items: raw.items.map((i) => interpolate(i, vars)) };
    }
    case 'table': {
      // Hoisted out of `raw` before the closure: narrowing a property of a
      // Record<string, unknown> does not survive into a callback, so reading
      // raw.headers.length inside .filter() would not typecheck.
      const headers = raw.headers;
      if (!isStringArray(headers) || headers.length === 0) return null;
      if (!Array.isArray(raw.rows)) return null;
      const rows = raw.rows
        .filter(
          (row): row is string[] =>
            isStringArray(row) && row.length === headers.length,
        )
        .map((row) => row.map((cell) => interpolate(cell, vars)));
      if (rows.length === 0) return null;
      return { type: 'table', headers: [...headers], rows };
    }
    case 'links': {
      if (!Array.isArray(raw.items)) return null;
      const items = raw.items
        .filter(
          (item): item is PolicyLink =>
            isRecord(item) &&
            typeof item.label === 'string' &&
            typeof item.href === 'string' &&
            isSafeHref(item.href),
        )
        .map((item) => ({ label: interpolate(item.label, vars), href: item.href }));
      if (items.length === 0) return null;
      return { type: 'links', items };
    }
    default:
      return null;
  }
}

/** Narrows the loose i18n JSON to typed blocks, interpolating runtime values.
 *  Malformed content is dropped rather than thrown: a bad locale edit should
 *  degrade the page, never white-screen a legal notice. */
export function parsePolicySections(value: unknown, vars: Vars = {}): PolicySection[] {
  if (!Array.isArray(value)) return [];

  const sections: PolicySection[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    if (typeof raw.id !== 'string' || typeof raw.title !== 'string') continue;
    if (!Array.isArray(raw.blocks)) continue;

    const blocks = raw.blocks
      .map((block) => parseBlock(block, vars))
      .filter((block): block is PolicyBlock => block !== null);

    sections.push({
      id: raw.id,
      title: interpolate(raw.title, vars),
      blocks,
    });
  }
  return sections;
}
