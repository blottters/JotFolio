// useVault — React hook wrapping the VaultAdapter.
//
// Responsibilities:
//   - Track current vault info (path/name) or null
//   - Load entries by scanning vault.list() + parsing each .md file
//   - Save/delete entries via entryToFile + vault.write / vault.move-to-trash
//   - Expose pickVault() that triggers folder picker (web-virtual or native dialog)
//   - Migration helper: copy legacy localStorage['mgn-e'] entries into the vault
//   - Subscribe to vault.watch() for external changes (plugins, user edits raw file)
//
// In the browser (LocalAdapter), "vault" is a virtual fs in localStorage under
// key `jf-vault-local`. In Electron (NodeFsAdapter), it's a real disk folder.
// React tree never knows the difference.

import { useCallback, useEffect, useRef, useState } from 'react';
import { vault } from '../../adapters/index.js';
import { entryToFile, fileToEntry, MANUAL_LINKS_FIELD } from '../../lib/frontmatter.js';
import { buildVaultIndex } from '../../lib/index/vaultIndex.js';
import { VaultError } from '../../adapters/VaultError.js';
import { moveToTrash } from '../../lib/vaultTrash.js';

const LEGACY_KEY = 'mgn-e';

export function useVault() {
  const [entries, setEntries] = useState([]);
  const [folders, setFolders] = useState([]);
  const [vaultInfo, setVaultInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Skip list tracks files that failed to parse (corruption recovery surface)
  const [issues, setIssues] = useState([]);
  const watchOffRef = useRef(null);
  // Live set of every vault-path currently in use (healthy entries + known
  // broken files). Used synchronously by saveEntry to pick a non-colliding
  // slug during batch imports and to avoid overwriting files whose
  // frontmatter failed to parse. Updated on every refresh + every save.
  const pathsInUseRef = useRef(new Set());

  // Refresh = re-scan vault → reload entries
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const files = await vault.list();
      const loaded = [];
      const badFiles = [];
      const explicitFolders = [];
      for (const f of files) {
        if (f.type === 'folder') {
          if (f.path) explicitFolders.push(f.path);
          continue;
        }
        // `.jotfolio/` is app-internal storage (plugin manifests, settings,
        // recovery snapshots, sync.log, etc). It is NOT user-authored notes
        // and must not be parsed as entries. Skip the whole subtree.
        if (f.path === '.jotfolio' || f.path.startsWith('.jotfolio/')) continue;
        // Only parse markdown files. Non-`.md` files that happen to live
        // at the vault root (images, PDFs, etc.) are future attachment
        // surface — ignore for entry parsing.
        if (!f.name.endsWith('.md')) continue;
        if (f.error) { badFiles.push({ path: f.path, error: f.error }); continue; }
        try {
          const content = await vault.read(f.path);
          const entry = fileToEntry({ path: f.path, content });
          loaded.push(entry);
        } catch (err) {
          badFiles.push({ path: f.path, error: { code: err.code || 'io-error', message: err.message } });
        }
      }
      const derived = buildVaultIndex(loaded).entries.map(entry => ({
        ...entry,
        [MANUAL_LINKS_FIELD]: entry[MANUAL_LINKS_FIELD] ?? false,
      }));
      // Sync path registry: healthy entries + broken files. Broken files must
      // NOT be silently overwritten — saveEntry treats them as taken slots.
      const inUse = new Set();
      for (const e of derived) { if (e._path) inUse.add(e._path); }
      for (const b of badFiles) { if (b.path) inUse.add(b.path); }
      pathsInUseRef.current = inUse;
      setEntries(derived);
      setFolders(explicitFolders);
      setIssues(badFiles);
    } catch (err) {
      setError(VaultError.is(err) ? err : new VaultError('io-error', err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  // Mount — check for existing vault, start watch
  useEffect(() => {
    (async () => {
      try {
        const path = await (async () => {
          try {
            const p = vault.getVaultPath();
            if (p) return p;
            // Electron adapter may expose currentPath asynchronously
            if (typeof window !== 'undefined' && window.electron?.vault?.currentPath) {
              return await window.electron.vault.currentPath();
            }
            return null;
          } catch { return null; }
        })();
        if (path) {
          setVaultInfo({ path, name: path.split(/[\\/]/).pop() || path });
          await refresh();
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    })();
    return () => {
      if (watchOffRef.current) { try { watchOffRef.current(); } catch { /* noop */ } }
    };
  }, [refresh]);

  // Subscribe to vault watch when a vault is active
  useEffect(() => {
    if (!vaultInfo) return;
    if (watchOffRef.current) watchOffRef.current();
    let pending = null;
    watchOffRef.current = vault.watch(() => {
      clearTimeout(pending);
      pending = setTimeout(() => { refresh(); }, 120);
    });
    return () => {
      if (watchOffRef.current) { watchOffRef.current(); watchOffRef.current = null; }
      clearTimeout(pending);
    };
  }, [vaultInfo, refresh]);

  const pickVault = useCallback(async () => {
    try {
      const info = await vault.pickVault();
      if (info) {
        setVaultInfo(info);
        await refresh();
      }
      return info;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [refresh]);

  // saveEntry reads from pathsInUseRef (a live set updated synchronously
  // below) rather than from the `entries` closure. This fixes the batch-import
  // stale-closure bug: before, multiple concurrent saveEntry calls all saw
  // the same snapshot of `entries` and could generate colliding paths. Now
  // each save reserves its path in the ref immediately, so subsequent saves
  // in the same tick get the correct -2 / -3 suffix.
  //
  // The ref also includes paths of broken files (from `issues`), so we never
  // silently overwrite a file whose frontmatter failed to parse. Corrupt
  // data = treated as a used slot; new entries suffix around it.
  const saveEntry = useCallback(async (entry) => {
    const inUse = new Set(pathsInUseRef.current);
    // Exclude the entry's own current path (rename case — the slot it occupies
    // is "free" for itself).
    const ownPath = typeof entry._path === 'string' ? entry._path : null;
    if (ownPath) inUse.delete(ownPath);

    const { path, content } = entryToFile(entry, p => inUse.has(p));

    // Reserve path synchronously BEFORE awaiting the write, so a second
    // saveEntry firing in the same tick sees this slot as taken.
    pathsInUseRef.current.add(path);

    try {
      await vault.write(path, content);
    } catch (err) {
      pathsInUseRef.current.delete(path);
      throw err;
    }

    // Remove old file if renamed (write succeeded first — atomic-enough).
    if (ownPath && ownPath !== path) {
      try { await vault.remove(ownPath); } catch { /* noop if already gone */ }
      pathsInUseRef.current.delete(ownPath);
    }

    const updated = { ...entry, _path: path };
    setEntries(list => {
      const idx = list.findIndex(e => e.id === entry.id);
      if (idx === -1) return [...list, updated];
      const next = [...list];
      next[idx] = updated;
      return next;
    });
    return updated;
  }, []);

  const deleteEntry = useCallback(async (id) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    if (entry._path) {
      try { await moveToTrash(vault, entry._path); }
      catch (err) { if (err?.code !== 'not-found') throw err; }
      pathsInUseRef.current.delete(entry._path);
    }
    setEntries(list => list.filter(e => e.id !== id));
  }, [entries]);

  // Migration — pull legacy localStorage entries into the vault once
  const migrateFromLocalStorage = useCallback(async () => {
    let legacy;
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (!raw) return { migrated: 0, total: 0, skipped: 0 };
      legacy = JSON.parse(raw);
    } catch (err) {
      throw new VaultError('io-error', 'Failed to parse legacy entries: ' + err.message);
    }
    if (!Array.isArray(legacy)) return { migrated: 0, total: 0, skipped: 0 };
    let migrated = 0;
    let skipped = 0;
    for (const e of legacy) {
      try {
        await saveEntry(e);
        migrated++;
      } catch (err) {
        skipped++;
        console.warn('migration skip', e?.id, err);
      }
    }
    return { migrated, total: legacy.length, skipped };
  }, [saveEntry]);

  return {
    entries,
    folders,
    vaultInfo,
    loading,
    error,
    issues,
    refresh,
    pickVault,
    saveEntry,
    deleteEntry,
    migrateFromLocalStorage,
  };
}
