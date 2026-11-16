import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FieldError } from './FieldError';

describe('FieldError', () => {
  it('renders children text and has role alert', () => {
    render(<FieldError id="err-1">Pole jest wymagane</FieldError>);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Pole jest wymagane');
    expect(alert).toHaveAttribute('id', 'err-1');
  });

  it('renders an inline SVG alert icon with aria-hidden', () => {
    const { container } = render(<FieldError>Nieprawidlowa wartosc</FieldError>);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('width', '14');
    expect(svg).toHaveAttribute('height', '14');
  });

  it('applies custom className when provided', () => {
    render(<FieldError className="extra-class">Blad</FieldError>);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('extra-class');
  });
});
