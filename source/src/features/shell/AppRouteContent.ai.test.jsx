import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppRouteContent } from './AppRouteContent.jsx';

function renderRoute(overrides = {}) {
  const props = {
    section: 'ai',
    query: '',
    setQuery: vi.fn(),
    searchResults: {},
    visibleEntries: [],
    openSettingsTab: vi.fn(),
    setDetailId: vi.fn(),
    onQuickSwitcher: vi.fn(),
    onCommandPalette: vi.fn(),
    onRevealEntry: vi.fn(),
    handleWorkstationNavigate: vi.fn(),
    setSection: vi.fn(),
    ...overrides,
  };

  render(<AppRouteContent {...props} />);
  return props;
}

describe('AppRouteContent AI route', () => {
  it('renders an honest AI Assistant route instead of the global search view', () => {
    const props = renderRoute();

    expect(screen.getByRole('region', { name: 'AI Assistant' })).toBeInTheDocument();
    expect(screen.getByText(/Source-grounded AI/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quick Switcher' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open AI Keys' }));
    expect(props.openSettingsTab).toHaveBeenCalledWith('ai');

    fireEvent.click(screen.getByRole('button', { name: 'Search vault instead' }));
    expect(props.setSection).toHaveBeenCalledWith('search');
  });
});
