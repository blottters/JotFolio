import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppConfirmDialog } from './AppConfirmDialog.jsx';

describe('AppConfirmDialog', () => {
  it('returns null when no request', () => {
    const { container } = render(
      <AppConfirmDialog request={null} onCancel={() => {}} onConfirm={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('invokes onConfirm when the confirm button submits', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <AppConfirmDialog
        request={{ title: 'Delete?', message: 'For real?', confirmLabel: 'Yes' }}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('Delete?');
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('invokes onCancel when the cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <AppConfirmDialog
        request={{ title: 'Hi' }}
        onCancel={onCancel}
        onConfirm={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
