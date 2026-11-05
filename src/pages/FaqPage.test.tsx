import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router-dom';
import { beforeEach, describe, it, expect } from 'vitest';
import i18n from '../i18n';
import { FaqPage } from './FaqPage';
import { renderAppRoutes, resetStores } from '../../test/utils';

describe('FaqPage', () => {
  beforeEach(() => {
    resetStores();
    void i18n.changeLanguage('pl');
  });

  it('renders heading, lead, search input, category pills and section headers', () => {
    renderAppRoutes(<Route path="/faq" element={<FaqPage />} />, {
      route: '/faq',
      authenticated: false,
    });

    expect(screen.getByRole('heading', { level: 1, name: /często zadawane pytania/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/szukaj w pytaniach/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /wszystkie tematy/i })).toBeInTheDocument();

    // Section headers
    expect(screen.getByRole('heading', { level: 2, name: /podstawy i pierwsze kroki/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /automatyczne śledzenie na pc/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /konsole i zapis głosem/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /zarządzanie sesjami, konflikty i kosz/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /co może pójść nie tak/i })).toBeInTheDocument();
  });

  it('toggles an accordion question on click', async () => {
    const user = userEvent.setup();

    renderAppRoutes(<Route path="/faq" element={<FaqPage />} />, {
      route: '/faq',
      authenticated: false,
    });

    const trigger = screen.getByRole('button', {
      name: /czym dokładnie jest gametrace/i,
    });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/bezobsługowy system monitorowania czasu/i)).toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('filters questions by search query', async () => {
    const user = userEvent.setup();

    renderAppRoutes(<Route path="/faq" element={<FaqPage />} />, {
      route: '/faq',
      authenticated: false,
    });

    const searchInput = screen.getByPlaceholderText(/szukaj w pytaniach/i);
    await user.type(searchInput, '409');

    // The 409 question is present and auto-expanded
    expect(screen.getByText(/czym jest błąd 409 conflict/i)).toBeInTheDocument();
    // Non-matching questions are filtered out
    expect(screen.queryByText(/czym dokładnie jest gametrace/i)).not.toBeInTheDocument();

    // Clear search
    const clearBtn = screen.getByRole('button', { name: /wyczyść wyszukiwanie/i });
    await user.click(clearBtn);

    expect(screen.getByText(/czym dokładnie jest gametrace/i)).toBeInTheDocument();
  });

  it('shows empty state when no questions match search query and allows reset', async () => {
    const user = userEvent.setup();

    renderAppRoutes(<Route path="/faq" element={<FaqPage />} />, {
      route: '/faq',
      authenticated: false,
    });

    const searchInput = screen.getByPlaceholderText(/szukaj w pytaniach/i);
    await user.type(searchInput, 'xyznonexistent12345');

    expect(screen.getByText(/nie znaleziono pytań pasujących do frazy/i)).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /wyczyść filtry/i });
    await user.click(resetBtn);

    expect(screen.getByText(/czym dokładnie jest gametrace/i)).toBeInTheDocument();
  });

  it('filters by category pill', async () => {
    const user = userEvent.setup();

    renderAppRoutes(<Route path="/faq" element={<FaqPage />} />, {
      route: '/faq',
      authenticated: false,
    });

    const categoryBtn = screen.getByRole('button', { name: /konsole i zapis głosem/i });
    await user.click(categoryBtn);

    expect(screen.getByRole('heading', { level: 2, name: /konsole i zapis głosem/i })).toBeInTheDocument();
    // Other sections are hidden
    expect(screen.queryByRole('heading', { level: 2, name: /podstawy i pierwsze kroki/i })).not.toBeInTheDocument();
  });

  it('handles Expand All and Collapse All', async () => {
    const user = userEvent.setup();

    renderAppRoutes(<Route path="/faq" element={<FaqPage />} />, {
      route: '/faq',
      authenticated: false,
    });

    const expandAllBtn = screen.getByRole('button', { name: /rozwiń wszystkie/i });
    await user.click(expandAllBtn);

    const triggers = screen.getAllByRole('button', { name: /czym dokładnie jest gametrace/i });
    expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');

    const collapseAllBtn = screen.getByRole('button', { name: /zwiń wszystkie/i });
    await user.click(collapseAllBtn);

    expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
  });

  it('auto-expands question when accessed via URL hash', () => {
    renderAppRoutes(<Route path="/faq" element={<FaqPage />} />, {
      route: '/faq#q-what-is-gametrace',
      authenticated: false,
    });

    const trigger = screen.getByRole('button', {
      name: /czym dokładnie jest gametrace/i,
    });

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
