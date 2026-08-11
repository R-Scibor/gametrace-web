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
