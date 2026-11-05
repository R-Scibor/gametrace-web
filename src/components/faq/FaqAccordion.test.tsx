import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FaqAccordion } from './FaqAccordion';
import type { FaqSectionData } from '../../types/faq';

const mockSections: FaqSectionData[] = [
  {
    id: 'section-1',
    title: 'Pierwsza sekcja',
    description: 'Opis pierwszej sekcji',
    questions: [
      {
        id: 'q-1',
        question: 'Pytanie 1 w sekcji 1',
        answer: ['Odpowiedź 1'],
      },
      {
        id: 'q-2',
        question: 'Pytanie 2 w sekcji 1',
        answer: ['Odpowiedź 2'],
      },
    ],
  },
  {
    id: 'section-2',
    title: 'Druga sekcja',
    description: 'Opis drugiej sekcji',
    questions: [
      {
        id: 'q-3',
        question: 'Pytanie 3 w sekcji 2',
        answer: ['Odpowiedź 3'],
      },
    ],
  },
];

describe('FaqAccordion', () => {
  it('renders section headers, descriptions, count badges, and questions', () => {
    render(
      <FaqAccordion
        sections={mockSections}
        openIds={new Set(['q-1'])}
        onToggleItem={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { level: 2, name: /pierwsza sekcja/i })).toBeInTheDocument();
    expect(screen.getByText('Opis pierwszej sekcji')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /druga sekcja/i })).toBeInTheDocument();

    expect(screen.getByText('Pytanie 1 w sekcji 1')).toBeInTheDocument();
    expect(screen.getByText('Pytanie 2 w sekcji 1')).toBeInTheDocument();
    expect(screen.getByText('Pytanie 3 w sekcji 2')).toBeInTheDocument();

    // q-1 is open
    expect(screen.getByText('Odpowiedź 1')).toBeInTheDocument();
  });
});
