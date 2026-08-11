import { describe, expect, test } from 'vitest';
import i18n from '../i18n';
import {
  isSafeHref,
  parsePolicySections,
  PRIVACY_POLICY_EFFECTIVE_DATE,
  PRIVACY_POLICY_VERSION,
  REQUIRED_SECTION_IDS,
} from './privacyPolicy';

describe('isSafeHref', () => {
  test('accepts https and root-relative paths', () => {
    expect(isSafeHref('https://uodo.gov.pl')).toBe(true);
    expect(isSafeHref('/delete-account')).toBe(true);
  });

  test('rejects javascript, http, and protocol-relative urls', () => {
    expect(isSafeHref('javascript:alert(1)')).toBe(false);
    expect(isSafeHref('http://example.com')).toBe(false);
    expect(isSafeHref('//evil.example')).toBe(false);
    expect(isSafeHref('delete-account')).toBe(false);
  });
});

describe('parsePolicySections', () => {
  test('parses every block type', () => {
    const sections = parsePolicySections([
      {
        id: 'voice',
        title: 'Voice',
        blocks: [
          { type: 'p', text: 'Para' },
          { type: 'ul', items: ['one', 'two'] },
          { type: 'table', headers: ['A', 'B'], rows: [['1', '2']] },
          { type: 'note', text: 'Careful' },
          { type: 'links', items: [{ label: 'UODO', href: 'https://uodo.gov.pl' }] },
        ],
      },
    ]);

    expect(sections).toHaveLength(1);
    expect(sections[0].id).toBe('voice');
    expect(sections[0].blocks.map((b) => b.type)).toEqual([
      'p',
      'ul',
      'table',
      'note',
      'links',
    ]);
  });

  test('drops unknown block types instead of throwing', () => {
    const sections = parsePolicySections([
      {
        id: 'data',
        title: 'Data',
        blocks: [{ type: 'iframe', src: 'evil' }, { type: 'p', text: 'kept' }],
      },
    ]);

    expect(sections[0].blocks).toEqual([{ type: 'p', text: 'kept' }]);
  });

  test('drops table rows whose length does not match the headers', () => {
    const sections = parsePolicySections([
      {
        id: 'retention',
        title: 'Retention',
        blocks: [
          { type: 'table', headers: ['A', 'B'], rows: [['1', '2'], ['oops']] },
        ],
      },
    ]);

    const block = sections[0].blocks[0];
    expect(block.type === 'table' && block.rows).toEqual([['1', '2']]);
  });

  test('drops links with unsafe hrefs and empty links blocks', () => {
    const sections = parsePolicySections([
      {
        id: 'transfers',
        title: 'Transfers',
        blocks: [
          {
            type: 'links',
            items: [
              { label: 'bad', href: 'javascript:alert(1)' },
              { label: 'good', href: 'https://openai.com/policies' },
            ],
          },
          { type: 'links', items: [{ label: 'all bad', href: 'javascript:x' }] },
        ],
      },
    ]);

    expect(sections[0].blocks).toEqual([
      {
        type: 'links',
        items: [{ label: 'good', href: 'https://openai.com/policies' }],
      },
    ]);
  });

  test('drops sections that are malformed', () => {
    expect(parsePolicySections([{ id: 'x' }, null, 'nope'])).toEqual([]);
    expect(parsePolicySections('not an array')).toEqual([]);
    expect(parsePolicySections(undefined)).toEqual([]);
  });

  test('interpolates vars into text, list items, table cells, and link labels', () => {
    const sections = parsePolicySections(
      [
        {
          id: 'account-deletion',
          title: 'Deletion',
          blocks: [
            { type: 'p', text: 'Grace is {{days}} days.' },
            { type: 'ul', items: ['Write to {{email}}'] },
            { type: 'table', headers: ['Stage'], rows: [['{{days}} days']] },
            { type: 'note', text: 'Up to {{days}} more days.' },
            { type: 'links', items: [{ label: '{{email}}', href: '/delete-account' }] },
          ],
        },
      ],
      { days: 7, email: 'a@b.c' },
    );

    const [p, ul, table, note, links] = sections[0].blocks;
    expect(p.type === 'p' && p.text).toBe('Grace is 7 days.');
    expect(ul.type === 'ul' && ul.items).toEqual(['Write to a@b.c']);
    expect(table.type === 'table' && table.rows).toEqual([['7 days']]);
    expect(note.type === 'note' && note.text).toBe('Up to 7 more days.');
    expect(links.type === 'links' && links.items[0].label).toBe('a@b.c');
  });

  test('leaves unknown placeholders untouched', () => {
    const sections = parsePolicySections(
      [{ id: 'a', title: 'A', blocks: [{ type: 'p', text: 'Hi {{nope}}' }] }],
      { days: 7 },
    );
    const block = sections[0].blocks[0];
    expect(block.type === 'p' && block.text).toBe('Hi {{nope}}');
  });
});

test('policy version is a non-empty string', () => {
  expect(PRIVACY_POLICY_VERSION).toMatch(/\S/);
});

test('required section ids include the pinned deletion anchor', () => {
  expect(REQUIRED_SECTION_IDS).toContain('account-deletion');
});

describe('version and date single sourcing', () => {
  const bundle = (lng: string) =>
    i18n.getResourceBundle(lng, 'privacy') as {
      sections?: unknown;
      lastUpdated?: string;
      versionLabel?: string;
    };

  test.each(['pl', 'en'])(
    'the %s prose carries no hardcoded version literal',
    (lng) => {
      const serialized = JSON.stringify(bundle(lng).sections);
      // Any "version 1.0" / "wersja 1.0" style literal would silently drift
      // when PRIVACY_POLICY_VERSION is bumped.
      expect(serialized).not.toMatch(/(wersja|version)\s+\d+\.\d+/i);
      expect(serialized).toContain('{{version}}');
    },
  );

  test.each(['pl', 'en'])('the %s version label interpolates', (lng) => {
    expect(bundle(lng).versionLabel).toContain('{{version}}');
    expect(bundle(lng).versionLabel).not.toMatch(/\d+\.\d+/);
  });

  test.each(['pl', 'en'])(
    'the %s lastUpdated string matches the effective date constant',
    (lng) => {
      const [year, , day] = PRIVACY_POLICY_EFFECTIVE_DATE.split('-');
      const lastUpdated = bundle(lng).lastUpdated ?? '';
      expect(lastUpdated).toContain(year);
      expect(lastUpdated).toMatch(new RegExp(`\\b${Number(day)}\\b`));
    },
  );
});

describe('locale parity', () => {
  const bundleSections = (lng: string): unknown =>
    (i18n.getResourceBundle(lng, 'privacy') as { sections?: unknown } | undefined)
      ?.sections;

  const enSections = parsePolicySections(bundleSections('en'));
  const plSections = parsePolicySections(bundleSections('pl'));

  test('both locales contain every required section id, in order', () => {
    expect(enSections.map((s) => s.id)).toEqual([...REQUIRED_SECTION_IDS]);
    expect(plSections.map((s) => s.id)).toEqual([...REQUIRED_SECTION_IDS]);
  });

  test('matching sections have matching block types', () => {
    for (const [index, enSection] of enSections.entries()) {
      const plSection = plSections[index];
      expect(plSection.blocks.map((b) => b.type)).toEqual(
        enSection.blocks.map((b) => b.type),
      );
    }
  });

  test('matching tables have the same shape', () => {
    for (const [index, enSection] of enSections.entries()) {
      const plSection = plSections[index];
      for (const [blockIndex, enBlock] of enSection.blocks.entries()) {
        if (enBlock.type !== 'table') continue;
        const plBlock = plSection.blocks[blockIndex];
        expect(plBlock.type).toBe('table');
        if (plBlock.type !== 'table') continue;
        expect(plBlock.headers).toHaveLength(enBlock.headers.length);
        expect(plBlock.rows).toHaveLength(enBlock.rows.length);
      }
    }
  });

  test('link hrefs are identical across locales', () => {
    for (const [index, enSection] of enSections.entries()) {
      const plSection = plSections[index];
      for (const [blockIndex, enBlock] of enSection.blocks.entries()) {
        if (enBlock.type !== 'links') continue;
        const plBlock = plSection.blocks[blockIndex];
        expect(plBlock.type).toBe('links');
        if (plBlock.type !== 'links') continue;
        expect(plBlock.items.map((i) => i.href)).toEqual(
          enBlock.items.map((i) => i.href),
        );
      }
    }
  });

  test('no section lost every block to the validator', () => {
    for (const section of [...enSections, ...plSections]) {
      expect(section.blocks.length).toBeGreaterThan(0);
    }
  });
});
