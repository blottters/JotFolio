import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Ribbon } from './Ribbon.jsx';

describe('Ribbon', () => {
  function renderRibbon(overrides = {}) {
    const props = {
      activeRoute: 'all',
      onTemplates: vi.fn(),
      onQuickSwitcher: vi.fn(),
      onNewCanvas: vi.fn(),
      onPalette: vi.fn(),
      onDailyNote: vi.fn(),
      onGraphView: vi.fn(),
      onSettings: vi.fn(),
      onTrash: vi.fn(),
      ...overrides,
    };
    render(<Ribbon {...props} />);
    return props;
  }

  it('renders all action buttons with labels', () => {
    renderRibbon();
    expect(screen.getByRole('button', { name: /Quick Switcher/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Canvas/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Settings/ })).toBeInTheDocument();
  });

  it('invokes the matching callback when an icon is clicked', () => {
    const props = renderRibbon();
    fireEvent.click(screen.getByRole('button', { name: /Trash/ }));
    expect(props.onTrash).toHaveBeenCalledTimes(1);
  });

  it('renders a trash badge when trashCount > 0', () => {
    renderRibbon({ trashCount: 5 });
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
