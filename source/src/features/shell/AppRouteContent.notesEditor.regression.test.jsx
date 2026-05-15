import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppRouteContent } from './AppRouteContent.jsx';

const noteEntries = [
  {
    id: 'note-main',
    type: 'note',
    title: 'Local-first Roadmap',
    notes: 'Plan the [[Capture Flow]] and resolve [[Missing Decision]].',
    tags: ['product', 'planning'],
    status: 'active',
    date: '2026-05-13T12:00:00.000Z',
    _path: 'notes/Local-first Roadmap.md',
    unresolvedTargets: [{ target: 'Missing Decision', line: 4 }],
  },
  {
    id: 'note-backlink',
    type: 'note',
    title: 'Meeting Notes',
    notes: 'See [[Local-first Roadmap]].',
    tags: ['meetings'],
    status: 'active',
    date: '2026-05-12T12:00:00.000Z',
    _path: 'notes/Meeting Notes.md',
    links: ['note-main'],
  },
];

function renderNotesRoute(overrides = {}) {
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
    entries: noteEntries,
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
    onOpenInConstellation: vi.fn(),
    projectRows: [],
    taskRows: [],
    calendarDays: {},
    spaces: [],
    setSection: vi.fn(),
    setFilterTag: vi.fn(),
    tagRows: [],
    renderSettingsPanel: vi.fn(() => null),
    canvases: [],
    visibleEntries: noteEntries,
    persistCanvas: vi.fn(),
    persistBase: vi.fn(),
    bases: [],
    onNewCanvas: vi.fn(),
    confirmDeleteEntry: vi.fn(),
    prefs: { featureFlags: {} },
    setPrefs: vi.fn(),
    createFromMissing: vi.fn(),
    constellationFocusId: '',
    filterStatus: '',
    setFilterStatus: vi.fn(),
    sort: 'date',
    setSort: vi.fn(),
    view: 'grid',
    setView: vi.fn(),
    hasFilters: false,
    clearFilters: vi.fn(),
    sectionTitle: 'Notes',
    filtered: noteEntries,
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

describe('AppRouteContent notes markdown editor route', () => {
  it('renders the dedicated editor route instead of the generic library list', () => {
    renderNotesRoute();

    expect(screen.getByRole('region', { name: 'Notes Markdown Editor' })).toBeInTheDocument();
    expect(screen.getByLabelText('Markdown editor for Local-first Roadmap')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /View mode/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/2 items/i)).not.toBeInTheDocument();
  });

  it('exposes the screenshot-style markdown editor affordances on the route surface', () => {
    renderNotesRoute();

    expect(screen.getByLabelText('Markdown editor for Local-first Roadmap')).toBeInTheDocument();
    const modeGroup = screen.getByRole('group', { name: /Editor mode/i });
    expect(within(modeGroup).getByRole('button', { name: /Edit/i })).toHaveAttribute('aria-pressed', 'true');
    expect(within(modeGroup).getByRole('button', { name: /Preview/i })).toBeInTheDocument();
    expect(within(modeGroup).getByRole('button', { name: /Backlinks/i })).toBeInTheDocument();
  });
});
