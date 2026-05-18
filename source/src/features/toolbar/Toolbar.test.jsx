import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Toolbar } from './Toolbar.jsx';

function renderToolbar(overrides = {}) {
  const props = {
    query: '',
    setQuery: vi.fn(),
    section: 'all',
    filterStatus: '',
    setFilterStatus: vi.fn(),
    sort: 'date',
    setSort: vi.fn(),
    view: 'grid',
    setView: vi.fn(),
    hasFilters: false,
    onClear: vi.fn(),
    ...overrides,
  };
  render(<Toolbar {...props} />);
  return props;
}

describe('Toolbar', () => {
  it('renders the search input', () => {
    renderToolbar();
    expect(screen.getByPlaceholderText('Search entries…')).toBeInTheDocument();
  });

  it('updates query on input change', () => {
    const props = renderToolbar();
    fireEvent.change(screen.getByPlaceholderText('Search entries…'), { target: { value: 'foo' } });
    expect(props.setQuery).toHaveBeenCalledWith('foo');
  });

  it('toggles view mode when the list button is clicked', () => {
    const props = renderToolbar();
    fireEvent.click(screen.getByRole('button', { name: 'List view' }));
    expect(props.setView).toHaveBeenCalledWith('list');
  });

  it('renders a clear button when hasFilters is true', () => {
    const props = renderToolbar({ hasFilters: true });
    fireEvent.click(screen.getByRole('button', { name: /Clear/ }));
    expect(props.onClear).toHaveBeenCalledTimes(1);
  });
});
