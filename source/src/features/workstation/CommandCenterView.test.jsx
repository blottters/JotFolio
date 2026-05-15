import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandCenterView } from './WorkstationViews.jsx';

const baseModel = {
  metrics: { entries: 12, openTasks: 3, dueToday: 1, memory: 2, inbox: 4 },
  pinned: [],
  projectRows: [],
  recentEntries: [],
  recentCaptures: [],
  focusQueue: [],
  overdueTasks: [],
};

describe('CommandCenterView reference shell', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows date stepping and a real focus selector like the reference screen', () => {
    render(
      <CommandCenterView
        model={baseModel}
        userName="Alex"
        onOpenEntry={vi.fn()}
        onNavigate={vi.fn()}
        onAdd={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Good morning, Alex' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous day' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next day' })).toBeInTheDocument();

    const focusSelect = screen.getByRole('combobox', { name: 'Focus mode' });
    expect(focusSelect).toHaveValue('deep-work');

    fireEvent.change(focusSelect, { target: { value: 'planning' } });
    expect(focusSelect).toHaveValue('planning');
    expect(screen.getByText('Planning Overview')).toBeInTheDocument();
  });

  it('makes mode panels interactive instead of static mockups', () => {
    const onNavigate = vi.fn();
    const onAdd = vi.fn();
    const onQuickCapture = vi.fn();
    render(
      <CommandCenterView
        model={baseModel}
        userName="Alex"
        onOpenEntry={vi.fn()}
        onNavigate={onNavigate}
        onAdd={onAdd}
        onQuickCapture={onQuickCapture}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Active Projects' }));
    expect(screen.getByText('68% · Changed 1h ago')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /JotFolio 2.0/ })[1]);
    expect(onNavigate).toHaveBeenCalledWith('projects');

    const focusSelect = screen.getByRole('combobox', { name: 'Focus mode' });
    fireEvent.change(focusSelect, { target: { value: 'planning' } });
    fireEvent.click(screen.getByRole('button', { name: 'Metrics review' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Priorities' }));
    expect(screen.getByRole('status')).toHaveTextContent('Priorities saved');
    fireEvent.click(screen.getByRole('button', { name: 'Start Review' }));
    expect(focusSelect).toHaveValue('review');
    expect(screen.getByText('Review Overview')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Reflection' }));
    fireEvent.change(screen.getByLabelText('What went well item 1'), { target: { value: 'PRD draft shipped' } });
    expect(screen.getByDisplayValue('PRD draft shipped')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Add note' })[0]);
    expect(screen.getByRole('status')).toHaveTextContent('Reflection note added');

    fireEvent.change(focusSelect, { target: { value: 'capture' } });
    expect(screen.getByText('Quick Capture')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /^Task/ })[0]);
    fireEvent.change(screen.getByLabelText('Quick capture text'), { target: { value: 'Follow up with Jamie' } });
    fireEvent.click(screen.getByRole('button', { name: /^Capture/ }));
    expect(onQuickCapture).toHaveBeenCalledWith(expect.objectContaining({ type: 'task', title: 'Follow up with Jamie' }));
    expect(screen.getByText('Follow up with Jamie')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Capture Inbox' }));
    expect(onNavigate).toHaveBeenCalledWith('raw');
  });

  it('surfaces real recent captures in capture mode and opens the entry', () => {
    const onOpenEntry = vi.fn();
    render(
      <CommandCenterView
        model={{
          ...baseModel,
          recentCaptures: [{
            id: 'raw-real',
            type: 'raw',
            title: 'Actual voice memo from vault',
            notes: 'Imported interview memo.',
            source: 'Voice Memos',
            date: '2026-05-14T09:15:00.000Z',
          }],
        }}
        userName="Alex"
        focusMode="capture"
        onOpenEntry={onOpenEntry}
        onNavigate={vi.fn()}
        onAdd={vi.fn()}
        onQuickCapture={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Actual voice memo from vault' }));
    expect(onOpenEntry).toHaveBeenCalledWith('raw-real');
  });
});
