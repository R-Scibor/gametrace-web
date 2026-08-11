import { render, screen, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PolicyBlocks } from './PolicyBlocks';

test('renders paragraphs, lists, notes, tables, and links', () => {
  render(
    <MemoryRouter>
      <PolicyBlocks
        blocks={[
          { type: 'p', text: 'A paragraph' },
          { type: 'ul', items: ['first', 'second'] },
          { type: 'note', text: 'A note' },
          {
            type: 'table',
            headers: ['Data', 'Retained'],
            rows: [['Tokens', '30 days']],
          },
          { type: 'links', items: [{ label: 'UODO', href: 'https://uodo.gov.pl' }] },
        ]}
      />
    </MemoryRouter>,
  );

  expect(screen.getByText('A paragraph')).toBeInTheDocument();
  expect(screen.getByText('first')).toBeInTheDocument();
  expect(screen.getByText('second')).toBeInTheDocument();
  expect(screen.getByText('A note')).toBeInTheDocument();

  const table = screen.getByRole('table');
  expect(within(table).getByText('Data')).toBeInTheDocument();
  expect(within(table).getByText('Tokens')).toBeInTheDocument();
  expect(within(table).getByText('30 days')).toBeInTheDocument();

  expect(screen.getByRole('link', { name: 'UODO' })).toHaveAttribute(
    'href',
    'https://uodo.gov.pl',
  );
});

test('external links open safely in a new tab, internal links do not', () => {
  render(
    <MemoryRouter>
      <PolicyBlocks
        blocks={[
          {
            type: 'links',
            items: [
              { label: 'External', href: 'https://openai.com/policies' },
              { label: 'Internal', href: '/delete-account' },
            ],
          },
        ]}
      />
    </MemoryRouter>,
  );

  const external = screen.getByRole('link', { name: 'External' });
  expect(external).toHaveAttribute('target', '_blank');
  expect(external).toHaveAttribute('rel', 'noreferrer noopener');

  const internal = screen.getByRole('link', { name: 'Internal' });
  expect(internal).not.toHaveAttribute('target');
});

test('renders nothing for an empty block list', () => {
  const { container } = render(<PolicyBlocks blocks={[]} />);
  expect(container).toBeEmptyDOMElement();
});

test('linkifies an email inside p and note text without swallowing trailing punctuation', () => {
  render(
    <MemoryRouter>
      <PolicyBlocks
        blocks={[
          { type: 'p', text: 'Write to a@b.com. Then wait.' },
          { type: 'note', text: 'Or write to a@b.com, if you prefer.' },
          { type: 'p', text: 'Or just email a@b.com' },
        ]}
      />
    </MemoryRouter>,
  );

  const links = screen.getAllByRole('link', { name: 'a@b.com' });
  expect(links).toHaveLength(3);
  for (const link of links) {
    expect(link).toHaveAttribute('href', 'mailto:a@b.com');
  }
});

test('does not linkify an email inside list items or table cells', () => {
  // Documents a known gap (see the comments on the `ul`/`table` cases in
  // PolicyBlocks.tsx): today every {{email}} in the locale content lives in a
  // `p`/`note` block, so this doesn't regress the live page. If a future
  // locale edit moves an address into a list or table, it will silently stop
  // being clickable — this test exists so that change is a visible, explicit
  // decision rather than a surprise.
  render(
    <MemoryRouter>
      <PolicyBlocks
        blocks={[
          { type: 'ul', items: ['Write to a@b.com for help'] },
          { type: 'table', headers: ['Contact'], rows: [['a@b.com']] },
        ]}
      />
    </MemoryRouter>,
  );

  expect(screen.queryByRole('link', { name: 'a@b.com' })).not.toBeInTheDocument();
  expect(screen.getByText('Write to a@b.com for help')).toBeInTheDocument();
  expect(screen.getByText('a@b.com')).toBeInTheDocument();
});
