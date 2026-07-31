import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../test/utils';
import { PreviewRow, QueuePreview } from './QueuePreview';

describe('QueuePreview', () => {
  it('renders rows and a view-all link', () => {
    renderWithProviders(
      <QueuePreview
        title="Otwarte zgłoszenia"
        to="/admin/reports?status=open"
        isLoading={false}
        isError={false}
        empty={false}
        emptyMessage="Brak"
      >
        <PreviewRow
          to="/admin/reports?status=open&report=17"
          primary="Nie mogę dodać sesji"
          secondary="testuser · dziś"
        />
      </QueuePreview>,
    );

    expect(screen.getByText('Otwarte zgłoszenia')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Zobacz wszystkie/i })).toHaveAttribute(
      'href',
      '/admin/reports?status=open',
    );
    expect(screen.getByRole('link', { name: /Nie mogę dodać sesji/i })).toHaveAttribute(
      'href',
      '/admin/reports?status=open&report=17',
    );
  });

  it('shows empty copy when the queue is clear', () => {
    renderWithProviders(
      <QueuePreview
        title="Otwarte zgłoszenia"
        to="/admin/reports?status=open"
        isLoading={false}
        isError={false}
        empty
        emptyMessage="Brak otwartych zgłoszeń."
      >
        <PreviewRow to="/x" primary="hidden" secondary="x" />
      </QueuePreview>,
    );

    expect(screen.getByText('Brak otwartych zgłoszeń.')).toBeInTheDocument();
    expect(screen.queryByText('hidden')).not.toBeInTheDocument();
  });
});
