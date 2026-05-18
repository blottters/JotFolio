import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandCenterView, getLocalGreeting } from './WorkstationViews.jsx';

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

  it('shows date stepping and a real home queue', () => {
    render(
      <CommandCenterView
        model={baseModel}
        userName="Alex"
        onOpenEntry={vi.fn()}
        onNavigate={vi.fn()}
        onAdd={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: /Good (morning|afternoon|evening), Alex/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous day' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next day' })).toBeInTheDocument();
    expect(screen.getByText('Home Queue')).toBeInTheDocument();
    expect(screen.getByText('Resume last note')).toBeInTheDocument();
    expect(screen.getByText('Process Inbox')).toBeInTheDocument();
    expect(screen.getByText('Open active project')).toBeInTheDocument();
    expect(screen.getByText("Continue today's task")).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Focus mode' })).not.toBeInTheDocument();
  });

  it('opens real queue targets instead of static mode panels', () => {
    const onNavigate = vi.fn();
    const onAdd = vi.fn();
    const onOpenEntry = vi.fn();
    const liveModel = {
      ...baseModel,
      recentEntries: [{ id: 'note-live', type: 'note', title: 'Live Note', _path: 'notes/Live Note.md', modified: '2026-05-14T10:00:00.000Z' }],
      recentCaptures: [{ id: 'raw-live', type: 'raw', title: 'Raw thought' }],
      tasksDueToday: [{ id: 'task-live', type: 'task', title: 'Ship test update', due: '2026-05-17', status: 'open' }],
      projectRows: [{
        entry: { id: 'p-live', type: 'project', title: 'JotFolio 2.0', status: 'active' },
        progress: 68,
        lastActivity: Date.now() - 60 * 60 * 1000, // 1h ago
        entryCount: 0,
        taskCount: 0,
        openTaskCount: 0,
      }],
    };
    render(
      <CommandCenterView
        model={liveModel}
        userName="Alex"
        onOpenEntry={onOpenEntry}
        onNavigate={onNavigate}
        onAdd={onAdd}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Resume last note/ }));
    expect(onOpenEntry).toHaveBeenCalledWith('note-live');
    fireEvent.click(screen.getByRole('button', { name: /Process Inbox/ }));
    expect(onNavigate).toHaveBeenCalledWith('raw');
    fireEvent.click(screen.getByRole('button', { name: /Open active project/ }));
    expect(onOpenEntry).toHaveBeenCalledWith('p-live');
    fireEvent.click(screen.getByRole('button', { name: /Continue today's task/ }));
    expect(onOpenEntry).toHaveBeenCalledWith('task-live');

    expect(screen.queryByText('Planning Overview')).not.toBeInTheDocument();
    expect(screen.queryByText('Weekly Reflection')).not.toBeInTheDocument();
    expect(screen.queryByText('Quick Capture')).not.toBeInTheDocument();
  });

  it('creates missing queue targets when the vault is empty', () => {
    const onAdd = vi.fn();
    render(
      <CommandCenterView
        model={baseModel}
        userName="Alex"
        onNavigate={vi.fn()}
        onAdd={onAdd}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Resume last note/ }));
    expect(onAdd).toHaveBeenCalledWith({ type: 'note' });
    fireEvent.click(screen.getByRole('button', { name: /Open active project/ }));
    expect(onAdd).toHaveBeenCalledWith({ type: 'project' });
    fireEvent.click(screen.getByRole('button', { name: /Continue today's task/ }));
    expect(onAdd).toHaveBeenCalledWith({ type: 'task' });
  });

  it('chooses the greeting from the supplied time zone hour', () => {
    const instant = new Date('2026-05-18T13:00:00.000Z');

    expect(getLocalGreeting(instant, 'America/New_York')).toBe('Good morning');
    expect(getLocalGreeting(instant, 'Europe/London')).toBe('Good afternoon');
    expect(getLocalGreeting(instant, 'Asia/Tokyo')).toBe('Good evening');
  });
});
