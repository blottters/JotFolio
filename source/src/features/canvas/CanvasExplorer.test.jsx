import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CanvasExplorer } from './CanvasExplorer.jsx';

describe('CanvasExplorer', () => {
  it('renders the empty hub when no canvas is selected', () => {
    render(<CanvasExplorer canvases={[]} entries={[]} />);
    expect(screen.getByText('Canvases')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ New Canvas' })).toBeInTheDocument();
  });

  it('calls onSelect when a canvas card is clicked', () => {
    const onSelect = vi.fn();
    render(
      <CanvasExplorer
        canvases={[{ id: 'c1', name: 'Map', nodes: [], edges: [] }]}
        entries={[]}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /▦ Map/ }));
    expect(onSelect).toHaveBeenCalledWith('c1');
  });

  it('calls onCreate when user names and submits a new canvas', () => {
    const onCreate = vi.fn();
    render(<CanvasExplorer canvases={[]} entries={[]} onCreate={onCreate} />);
    fireEvent.click(screen.getByRole('button', { name: '+ New Canvas' }));
    fireEvent.change(screen.getByPlaceholderText('Canvas name'), { target: { value: 'Plan' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate.mock.calls[0][0]).toMatchObject({ name: 'Plan' });
  });
});
