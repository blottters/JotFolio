import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TemplatesPanel } from './TemplatesPanel.jsx';

describe('TemplatesPanel', () => {
  it('renders the empty template state when none exist', () => {
    render(<TemplatesPanel templates={[]} entries={[]} />);
    expect(screen.getByText(/No templates yet/)).toBeInTheDocument();
  });

  it('selects a template by default and shows its editor', () => {
    render(
      <TemplatesPanel
        templates={[{ id: 't1', name: 'daily', path: 'templates/daily.md', body: 'Hello' }]}
        entries={[]}
      />,
    );
    expect(screen.getByText('daily.md', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByLabelText('Edit template daily')).toHaveValue('Hello');
  });

  it('creates a new template via the inline form', () => {
    const onCreate = vi.fn();
    render(<TemplatesPanel templates={[]} entries={[]} onCreate={onCreate} />);
    fireEvent.click(screen.getByRole('button', { name: '+ New template' }));
    fireEvent.change(screen.getByLabelText('New template name'), { target: { value: 'weekly' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreate).toHaveBeenCalledWith({ name: 'weekly' });
  });
});
