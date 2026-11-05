import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FaqCallout } from './FaqCallout';

describe('FaqCallout', () => {
  it('renders tip callout with title and text', () => {
    render(
      <FaqCallout
        callout={{
          type: 'tip',
          title: 'Ważna wskazówka',
          text: 'To jest treść wskazówki.',
        }}
      />,
    );

    expect(screen.getByText('Ważna wskazówka')).toBeInTheDocument();
    expect(screen.getByText('To jest treść wskazówki.')).toBeInTheDocument();
  });

  it('renders gotcha callout without title', () => {
    render(
      <FaqCallout
        callout={{
          type: 'gotcha',
          text: 'Uważaj na ten przypadek.',
        }}
      />,
    );

    expect(screen.getByText('Uważaj na ten przypadek.')).toBeInTheDocument();
  });
});
