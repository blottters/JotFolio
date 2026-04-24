import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Toasts } from './Toasts.jsx';

describe('Toasts', () => {
  it('renders toasts in a polite status live region', () => {
    render(<Toasts toasts={[{ id: '1', type: 'info', msg: 'Saved' }]} />);

    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('Saved');
  });
});
