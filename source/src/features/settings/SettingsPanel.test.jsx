import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from './SettingsPanel.jsx';

const adapter = vi.hoisted(() => ({
  list: vi.fn(async () => []),
  read: vi.fn(async () => {
    const err = new Error('not found');
    err.code = 'not-found';
    throw err;
  }),
  write: vi.fn(async () => {}),
  remove: vi.fn(async () => {}),
  move: vi.fn(async () => {}),
  mkdir: vi.fn(async () => {}),
}));

vi.mock('../../adapters/index.js', () => ({
  vault: adapter,
}));

const defaultPrefs = {
  fontSize: 13,
  fontFamily: '',
  cardDensity: 'comfortable',
  sidebarWidth: 272,
  defaultView: 'grid',
  defaultSort: 'date',
  showNotesPreview: true,
  showDateOnCards: true,
  showTagsOnCards: true,
  defaultLayoutMode: 'messy',
  constellationStyle: 'star',
  typeSaturation: 'signal',
  constellationBg: 'atlas',
  featureFlags: {},
};

function renderSettingsPanel(overrides = {}) {
  return render(
    <SettingsPanel
      embedded
      theme="obsidian"
      setTheme={vi.fn()}
      darkMode="dark"
      setDarkMode={vi.fn()}
      isDark
      victoryColors={{}}
      setVictoryColors={vi.fn()}
      onExportJSON={vi.fn()}
      onExportMD={vi.fn()}
      onImportJSON={vi.fn()}
      onLoadConstellationDemo={vi.fn()}
      entries={[]}
      entryCount={0}
      prefs={defaultPrefs}
      setPrefs={vi.fn()}
      keywordRules={[]}
      onKeywordRulesChange={vi.fn()}
      onRescanVault={vi.fn()}
      vaultInfo={{ path: 'C:/Vault', name: 'Vault' }}
      pickVault={vi.fn()}
      migrateFromLocalStorage={vi.fn()}
      vaultLoading={false}
      vaultError={null}
      vaultIssues={[]}
      refreshVault={vi.fn()}
      onClose={vi.fn()}
      {...overrides}
    />,
  );
}

describe('SettingsPanel vault safety', () => {
  const trashPath = '.jotfolio/trash/2026-05-14T09-00-00-000Z/notes/Deleted.md';

  beforeEach(() => {
    vi.clearAllMocks();
    adapter.list.mockResolvedValue([
      { type: 'file', name: 'Deleted.md', path: trashPath },
    ]);
  });

  it('requires inline confirmation before restore, permanent delete, or empty trash mutate files', async () => {
    renderSettingsPanel();

    fireEvent.click(screen.getByRole('button', { name: /Vault/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Review' }));

    expect(await screen.findByText('notes/Deleted.md')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    const restoreConfirm = screen.getByRole('group', { name: 'Restore file' });
    expect(restoreConfirm).toBeInTheDocument();
    expect(adapter.move).not.toHaveBeenCalled();
    fireEvent.click(within(restoreConfirm).getByRole('button', { name: 'Cancel' }));

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const deleteConfirm = screen.getByRole('group', { name: 'Permanently delete file' });
    expect(deleteConfirm).toBeInTheDocument();
    expect(adapter.remove).not.toHaveBeenCalled();
    fireEvent.click(within(deleteConfirm).getByRole('button', { name: 'Cancel' }));

    fireEvent.click(screen.getByRole('button', { name: /empty trash/i }));
    const emptyConfirm = screen.getByRole('group', { name: 'Empty JotFolio Trash' });
    expect(emptyConfirm).toBeInTheDocument();
    fireEvent.click(within(emptyConfirm).getByRole('button', { name: 'Cancel' }));

    expect(adapter.move).not.toHaveBeenCalled();
    expect(adapter.remove).not.toHaveBeenCalled();
  });
});

describe('SettingsPanel routing', () => {
  it('can open directly to the AI Keys tab', () => {
    renderSettingsPanel({ initialTab: 'ai' });

    expect(screen.getByText(/Provider settings only/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AI Keys' })).toBeInTheDocument();
  });

  it('names library card display toggles', () => {
    renderSettingsPanel({ initialTab: 'library' });

    expect(screen.getByRole('button', { name: 'Show notes preview' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Show date' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Show tags' })).toHaveAttribute('aria-pressed', 'true');
  });
});
