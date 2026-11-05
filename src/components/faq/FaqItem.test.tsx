import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FaqItem } from './FaqItem';
import type { FaqQuestionData } from '../../types/faq';

const mockQuestion: FaqQuestionData = {
  id: 'test-question',
  badge: 'TEST',
  question: 'Czy to jest przykładowe pytanie?',
  answer: ['To jest pierwszy akapit odpowiedzi.', 'To jest drugi akapit.'],
  steps: ['Krok pierwszy', 'Krok drugi'],
  callout: {
    type: 'tip',
    title: 'Wskazówka',
    text: 'Przydatna informacja',
  },
};

describe('FaqItem', () => {
  it('renders question title, badge and initial collapsed state', () => {
    render(
      <FaqItem
        question={mockQuestion}
        isOpen={false}
        onToggle={() => {}}
      />,
    );

    const trigger = screen.getByRole('button', { name: /czy to jest przykładowe pytanie/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('TEST')).toBeInTheDocument();
  });

  it('calls onToggle when trigger button is clicked', async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();

    render(
      <FaqItem
        question={mockQuestion}
        isOpen={false}
        onToggle={handleToggle}
      />,
    );

    const trigger = screen.getByRole('button', { name: /czy to jest przykładowe pytanie/i });
    await user.click(trigger);

    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('renders answer paragraphs, steps and callouts when open', () => {
    render(
      <FaqItem
        question={mockQuestion}
        isOpen={true}
        onToggle={() => {}}
      />,
    );

    const trigger = screen.getByRole('button', { name: /czy to jest przykładowe pytanie/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('To jest pierwszy akapit odpowiedzi.')).toBeInTheDocument();
    expect(screen.getByText('To jest drugi akapit.')).toBeInTheDocument();
    expect(screen.getByText('Krok pierwszy')).toBeInTheDocument();
    expect(screen.getByText('Krok drugi')).toBeInTheDocument();
    expect(screen.getByText('Przydatna informacja')).toBeInTheDocument();
  });

  it('handles copy link action without triggering onToggle', async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();
    const handleCopy = vi.fn();

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
      writable: true,
    });

    render(
      <FaqItem
        question={mockQuestion}
        isOpen={false}
        onToggle={handleToggle}
        onCopyLink={handleCopy}
      />,
    );

    const copyBtn = screen.getByTitle(/kopiuj link do pytania/i);
    await user.click(copyBtn);

    expect(handleCopy).toHaveBeenCalledWith('test-question');
    expect(handleToggle).not.toHaveBeenCalled();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('#q-test-question'),
    );
  });
});
