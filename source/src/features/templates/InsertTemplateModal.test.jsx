import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InsertTemplateModal } from './InsertTemplateModal.jsx';

const templates = [
  { id: 't1', name: 'Daily Note', path: 'templates/daily-note.md', body: '' },
  { id: 't2', name: 'Meeting', path: 'templates/meeting.md', body: '' },
];

describe('InsertTemplateModal', () => {
  it('returns null when not open', () => {
    const { container } = render(
      <InsertTemplateModal open={false} templates={templates} onInsert={() => {}} onClose={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders templates and inserts the first one on Enter', () => {
    const onInsert = vi.fn();
    render(
      <InsertTemplateModal open templates={templates} onInsert={onInsert} onClose={() => {}} />,
    );
    expect(screen.getByText('Daily Note')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByLabelText('Saved template search'), { key: 'Enter' });
    expect(onInsert).toHaveBeenCalledWith(templates[0]);
  });

  it('filters templates by query', () => {
    render(
      <InsertTemplateModal open templates={templates} onInsert={() => {}} onClose={() => {}} />,
    );
    fireEvent.change(screen.getByLabelText('Saved template search'), { target: { value: 'meet' } });
    expect(screen.queryByText('Daily Note')).not.toBeInTheDocument();
    expect(screen.getByText('Meeting')).toBeInTheDocument();
  });
});
