import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CanvasView } from './CanvasView.jsx';

function canvas() {
  return {
    id: 'canvas-1',
    name: 'Project Map',
    nodes: [
      { id: 'n1', type: 'text', x: 40, y: 60, width: 180, height: 120, text: 'Source' },
      { id: 'n2', type: 'text', x: 320, y: 80, width: 180, height: 120, text: 'Target' },
    ],
    edges: [
      { id: 'e1', fromNode: 'n1', toNode: 'n2', label: '' },
    ],
  };
}

describe('CanvasView controls', () => {
  it('edits edge labels inline instead of using a blocking prompt', () => {
    const onCanvasChange = vi.fn();
    const prompt = vi.fn(() => 'prompt label');
    vi.stubGlobal('prompt', prompt);
    const { container } = render(
      <CanvasView canvas={canvas()} entries={[]} onCanvasChange={onCanvasChange} />,
    );

    fireEvent.click(container.querySelector('line'));

    expect(prompt).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Edge label'), { target: { value: 'supports' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save edge label' }));

    expect(onCanvasChange).toHaveBeenCalledWith(expect.objectContaining({
      edges: [expect.objectContaining({ id: 'e1', label: 'supports' })],
    }));
  });
});
