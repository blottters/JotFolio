import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PluginPanelSlot, createPanelStore } from './PluginPanelSlot.jsx';

describe('PluginPanelSlot', () => {
  it('renders nothing when no panels are registered', () => {
    const store = createPanelStore();
    const { container } = render(<PluginPanelSlot panelStore={store} entries={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a registered panel and re-renders on subscribe notify', () => {
    const store = createPanelStore();
    store.register({ id: 'p1', render: () => <div>panel-content</div> });
    render(<PluginPanelSlot panelStore={store} entries={[]} />);
    expect(screen.getByText('panel-content')).toBeInTheDocument();
  });
});

describe('createPanelStore', () => {
  it('register returns an unregister function that removes the panel', () => {
    const store = createPanelStore();
    const off = store.register({ id: 'x', render: () => null });
    expect(store.list()).toHaveLength(1);
    off();
    expect(store.list()).toHaveLength(0);
  });
});
