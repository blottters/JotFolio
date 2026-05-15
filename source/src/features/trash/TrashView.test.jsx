import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrashView } from './TrashView.jsx';

describe('TrashView', () => {
  it('uses safer permanent-delete wording while preserving the delete callback', () => {
    const onPermanentDelete = vi.fn();
    const path = '.jotfolio/trash/2026-05-13T00-00-00-000Z/notes/example.md';

    render(
      <TrashView
        items={[{ path, size: 2048 }]}
        busy={false}
        error=""
        onRefresh={vi.fn()}
        onRestore={vi.fn()}
        onPermanentDelete={onPermanentDelete}
        onEmptyTrash={vi.fn()}
      />
    );

    expect(screen.getByText('notes/example.md')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Delete forever'));

    expect(onPermanentDelete).toHaveBeenCalledWith(path);
  });
});
