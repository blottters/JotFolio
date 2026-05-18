import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UpdatesPanel } from './UpdatesPanel.jsx';

describe('UpdatesPanel', () => {
  afterEach(() => {
    delete window.electron;
  });

  it('renders desktop-only message in browser preview mode', () => {
    render(<UpdatesPanel />);
    expect(screen.getByText('Desktop only')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check now' })).toBeDisabled();
  });

  it('renders the installed version label', () => {
    render(<UpdatesPanel />);
    expect(screen.getByText('JotFolio')).toBeInTheDocument();
  });
});

describe('UpdatesPanel with updater bridge', () => {
  beforeEach(() => {
    window.electron = {
      updater: {
        check: () => Promise.resolve({ ok: true }),
        onStatus: () => () => {},
      },
    };
  });
  afterEach(() => {
    delete window.electron;
  });

  it('enables the check button when updater is available', () => {
    render(<UpdatesPanel />);
    expect(screen.getByRole('button', { name: 'Check now' })).not.toBeDisabled();
  });
});
