import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PropertiesPanel } from './PropertiesPanel.jsx';

describe('PropertiesPanel', () => {
  it('renders an empty notice when entry has no visible properties', () => {
    render(<PropertiesPanel entry={{ id: 'x', title: 'T' }} onUpdate={() => {}} allKeys={[]} />);
    expect(screen.getByText('No properties yet.')).toBeInTheDocument();
  });

  it('lets the user edit a property value and emits the patch', () => {
    const onUpdate = vi.fn();
    render(
      <PropertiesPanel
        entry={{ id: 'x', title: 'T', author: 'Alice' }}
        onUpdate={onUpdate}
        allKeys={[]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit author' }));
    const input = screen.getByDisplayValue('Alice');
    fireEvent.change(input, { target: { value: 'Bob' } });
    fireEvent.blur(input);
    expect(onUpdate).toHaveBeenCalledWith({ author: 'Bob' });
  });

  it('deletes a property when delete button is clicked', () => {
    const onUpdate = vi.fn();
    render(
      <PropertiesPanel
        entry={{ id: 'x', title: 'T', author: 'Alice' }}
        onUpdate={onUpdate}
        allKeys={[]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete property author' }));
    expect(onUpdate).toHaveBeenCalledWith({ author: undefined });
  });
});
