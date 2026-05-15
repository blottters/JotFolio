import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NoteBody } from './NoteBody.jsx';

const baseEntry = {
  id: 'note-1',
  type: 'note',
  title: 'Editor Test',
  notes: '# Existing\n\nhello world',
  tags: [],
  links: [],
};

function renderEditor(props = {}) {
  const onUpdate = vi.fn();
  const onUpdateEntry = vi.fn();
  render(
    <NoteBody
      entry={{ ...baseEntry, ...props.entry }}
      entries={props.entries || []}
      onUpdate={onUpdate}
      onUpdateEntry={onUpdateEntry}
      onOpenEntry={vi.fn()}
    />,
  );
  return { onUpdate, onUpdateEntry };
}

describe('NoteBody Markdown editor', () => {
  it('toggles between edit and preview while showing live editor status', async () => {
    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: /notes/i }));

    expect(screen.getByRole('tab', { name: 'Edit' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Preview' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('textbox', { name: 'Markdown editor' })).toHaveValue('# Existing\n\nhello world');
    expect(screen.getByText('3 words')).toBeInTheDocument();
    expect(screen.getByText('3 lines')).toBeInTheDocument();
    expect(screen.getByText('23 B')).toBeInTheDocument();
    expect(screen.getByText(/Markdown/)).toBeInTheDocument();
    expect(screen.getByText(/Spaces: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Live/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Preview' }));

    expect(screen.getByRole('heading', { name: 'Existing' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Markdown editor' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Edit' }));
    expect(screen.getByRole('textbox', { name: 'Markdown editor' })).toBeInTheDocument();
  });

  it('applies toolbar commands to the current selection or caret position', () => {
    renderEditor({ entry: { notes: 'hello world' } });
    fireEvent.click(screen.getByRole('button', { name: /notes/i }));

    const editor = screen.getByRole('textbox', { name: 'Markdown editor' });
    editor.setSelectionRange(6, 11);
    fireEvent.click(screen.getByRole('button', { name: 'Bold' }));
    expect(editor).toHaveValue('hello **world**');

    const cases = [
      ['Heading 1', '# Heading'],
      ['Heading 2', '## Heading'],
      ['Italic', '*text*'],
      ['Link', '[label](https://example.com)'],
      ['Inline code', '`code`'],
      ['Bulleted list', '- List item'],
      ['Numbered list', '1. List item'],
      ['Checklist', '- [ ] Task'],
      ['Quote', '> Quote'],
      ['Image', '![alt text](image-url)'],
      ['Table', '| Column 1 | Column 2 |'],
    ];

    for (const [label, expected] of cases) {
      fireEvent.change(editor, { target: { value: '' } });
      editor.setSelectionRange(0, 0);
      fireEvent.click(screen.getByRole('button', { name: label }));
      expect(editor.value).toContain(expected);
    }
  });

  it('debounces saves through onUpdateEntry when provided', async () => {
    vi.useFakeTimers();
    try {
      const { onUpdateEntry, onUpdate } = renderEditor({ entry: { notes: '' } });
      fireEvent.click(screen.getByRole('button', { name: /add notes/i }));

      fireEvent.change(screen.getByRole('textbox', { name: 'Markdown editor' }), {
        target: { value: 'A saved markdown note' },
      });

      expect(onUpdateEntry).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(249));
      expect(onUpdateEntry).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));

      expect(onUpdateEntry).toHaveBeenCalledWith('note-1', expect.objectContaining({
        notes: 'A saved markdown note',
      }));
      expect(onUpdate).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
