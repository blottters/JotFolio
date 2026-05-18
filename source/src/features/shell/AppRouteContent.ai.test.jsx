import { render, screen } from '@testing-library/react';
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
    renderSettingsPanel: vi.fn((embedded, initialTab) => (
      <section aria-label="Settings">
        <button type="button">AI Keys</button>
        <p>Provider settings only.</p>
        <p data-testid="settings-render-args">{String(embedded)}:{initialTab}</p>
      </section>
    )),
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
  it('routes legacy AI navigation to Settings AI Keys instead of a fake main route', () => {
    const props = renderRoute();

    expect(screen.queryByRole('region', { name: 'AI Setup' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AI Keys' })).toBeInTheDocument();
    expect(screen.getByText(/Provider settings only/i)).toBeInTheDocument();
    expect(screen.getByTestId('settings-render-args')).toHaveTextContent('true:ai');
    expect(props.renderSettingsPanel).toHaveBeenCalledWith(true, 'ai');
    expect(props.openSettingsTab).not.toHaveBeenCalled();
  });
});
