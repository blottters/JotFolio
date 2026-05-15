import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRouteContent } from './AppRouteContent.jsx';

const noteA = {
  id: 'n-1',
  type: 'note',
  title: 'Local-first Roadmap',
  notes: 'Markdown planning notes',
  tags: ['product'],
  date: '2026-05-14T12:00:00.000Z',
  _path: 'notes/Local-first Roadmap.md',
};

const noteB = {
  id: 'n-2',
  type: 'note',
  title: 'Design Questions',
  notes: 'Open design questions',
  tags: ['design'],
  date: '2026-05-13T12:00:00.000Z',
  starred: true,
};

function renderRoute(overrides = {}) {
  const props = {
    section: 'note',
    currentCanvasId: null,
    currentBaseId: null,
    currentBase: null,
    templates: [],
    handleCreateTemplate: vi.fn(),
    handleInsertTemplate: vi.fn(),
    handleSaveTemplate: vi.fn(),
    detailId: null,
    entries: [noteA, noteB],
    selectedTemplateId: null,
    setSelectedTemplateId: vi.fn(),
    setDetailId: vi.fn(),
    trashItems: [],
    trashBusy: false,
    trashError: '',
    loadTrashItems: vi.fn(),
    restoreTrashItem: vi.fn(),
    permanentlyDeleteTrashItem: vi.fn(),
    emptyTrash: vi.fn(),
    workstationModel: {},
    userName: 'Gavin',
    focusMode: 'deep-work',
    onFocusModeChange: vi.fn(),
    handleWorkstationNavigate: vi.fn(),
    openAdd: vi.fn(),
    onQuickCapture: vi.fn(),
    query: '',
    setQuery: vi.fn(),
    searchResults: {},
    onQuickSwitcher: vi.fn(),
    onCommandPalette: vi.fn(),
    onRevealEntry: vi.fn(),
    projectRows: [],
    taskRows: [],
    calendarDays: {},
    spaces: [],
    setSection: vi.fn(),
    setFilterTag: vi.fn(),
    tagRows: [],
    renderSettingsPanel: vi.fn(),
    canvases: [],
    visibleEntries: [noteA, noteB],
    persistCanvas: vi.fn(),
    persistBase: vi.fn(),
    bases: [],
    onNewCanvas: vi.fn(),
    confirmDeleteEntry: vi.fn(),
    prefs: { featureFlags: {}, showNotesPreview: true, showDateOnCards: true, showTagsOnCards: true },
    setPrefs: vi.fn(),
    createFromMissing: vi.fn(),
    filterStatus: '',
    setFilterStatus: vi.fn(),
    sort: 'date',
    setSort: vi.fn(),
    view: 'grid',
    setView: vi.fn(),
    hasFilters: false,
    clearFilters: vi.fn(),
    sectionTitle: 'Notes',
    filtered: [noteA, noteB],
    storageError: null,
    vaultError: null,
    loaded: true,
    activation: {},
    selectedIds: new Set(),
    setSelectedIds: vi.fn(),
    toggleSelected: vi.fn(),
    updateEntry: vi.fn(),
    handleCompileRaw: vi.fn(),
    bulkTrashSelected: vi.fn(),
    clearSelection: vi.fn(),
    ...overrides,
  };
  render(<AppRouteContent {...props} />);
  return props;
}

describe('AppRouteContent notes route', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a dedicated notes workspace and opens the first note when none is selected', async () => {
    renderRoute();

    expect(screen.getByRole('region', { name: 'Notes Markdown Editor' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Open notes' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Local-first Roadmap/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Markdown editor for Local-first Roadmap')).toBeInTheDocument();
  });

  it('shows a route-level empty state instead of the generic library grid', () => {
    renderRoute({ entries: [], visibleEntries: [], filtered: [] });

    expect(screen.getByRole('region', { name: 'Notes Markdown Editor' })).toBeInTheDocument();
    expect(screen.getByText('No notes yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New Entry' })).toBeInTheDocument();
    expect(screen.queryByText('Select view')).not.toBeInTheDocument();
  });

  it('wires notes editor saves through route updateEntry', async () => {
    vi.useFakeTimers();
    const props = renderRoute();

    fireEvent.change(screen.getByRole('textbox', { name: /Markdown editor for Local-first Roadmap/i }), {
      target: { value: 'Updated route notes' },
    });

    await act(async () => {
      vi.advanceTimersByTime(750);
    });

    expect(props.updateEntry).toHaveBeenCalledWith('n-1', expect.objectContaining({ notes: 'Updated route notes' }));
  });
});
