import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceTopBar } from './WorkspaceTopBar.jsx';

describe('WorkspaceTopBar', () => {
  it('matches the reference shell controls and wires capture/search actions', () => {
    const setQuery = vi.fn();
    const onCapture = vi.fn();
    const onQuickSwitcher = vi.fn();
    const onCommandPalette = vi.fn();
    const onSearchActivate = vi.fn();
    const onNotifications = vi.fn();
    const onSettings = vi.fn();
    const onBack = vi.fn();
    const onForward = vi.fn();

    render(
      <WorkspaceTopBar
        query="local-first"
        setQuery={setQuery}
        onCapture={onCapture}
        onQuickSwitcher={onQuickSwitcher}
        onCommandPalette={onCommandPalette}
        onSearchActivate={onSearchActivate}
        onNotifications={onNotifications}
        onSettings={onSettings}
        onBack={onBack}
        onForward={onForward}
        canGoBack
        canGoForward
        userName="Gavin"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    fireEvent.click(screen.getByRole('button', { name: /forward/i }));
    expect(onBack).toHaveBeenCalled();
    expect(onForward).toHaveBeenCalled();
    expect(screen.getByText('JotFolio')).toBeInTheDocument();
    expect(screen.getByLabelText(/search notes, projects, people, tags/i)).toHaveValue('local-first');

    const search = screen.getByLabelText(/search notes, projects, people, tags/i);
    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: 'vault' } });
    expect(onSearchActivate).toHaveBeenCalled();
    expect(setQuery).toHaveBeenCalledWith('vault');

    expect(screen.queryByRole('button', { name: /quick actions/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /notifications/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /quick actions/i }));
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    fireEvent.click(screen.getByRole('button', { name: /capture/i }));
    fireEvent.click(screen.getByRole('button', { name: /user profile/i }));

    expect(screen.getByText('⌘K')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /user profile/i })).toHaveTextContent('G');
    expect(onCapture).toHaveBeenCalled();
    expect(onQuickSwitcher).toHaveBeenCalled();
    expect(onNotifications).toHaveBeenCalled();
    expect(onSettings).toHaveBeenCalled();
  });
});
