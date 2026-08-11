import { describe, expect, test } from 'vitest';
import {
  isSafeHref,
  parsePolicySections,
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
