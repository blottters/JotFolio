import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VaultPicker } from './VaultPicker.jsx';

describe('VaultPicker', () => {
  it('renders the modal welcome screen by default', () => {
    render(<VaultPicker onPick={() => {}} onMigrate={() => {}} />);
    expect(screen.getByText(/Welcome to JotFolio/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pick a vault folder/ })).toBeInTheDocument();
  });

  it('invokes onPick when the pick button is clicked', () => {
    const onPick = vi.fn(() => Promise.resolve(null));
    render(<VaultPicker onPick={onPick} onMigrate={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Pick a vault folder/ }));
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it('renders the inline card with the current vault path', () => {
    render(
      <VaultPicker
        mode="inline"
        vaultInfo={{ path: '/Users/me/vault', name: 'vault' }}
        onPick={() => {}}
        onMigrate={() => {}}
      />,
    );
    expect(screen.getByText('/Users/me/vault')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Change vault/ })).toBeInTheDocument();
  });
});
