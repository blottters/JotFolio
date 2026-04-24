// useVault — React hook wrapping the VaultAdapter.
//
// Responsibilities:
//   - Track current vault info (path/name) or null
//   - Load entries by scanning vault.list() + parsing each .md file
//   - Save/delete entries via entryToFile + vault.write / vault.remove
//   - Expose pickVault() that triggers folder picker (web-virtual or native dialog)
//   - Migration helper: copy legacy localStorage['mgn-e'] entries into the vault
//   - Subscribe to vault.watch() for external changes (plugins, user edits raw file)
//
// In the browser (LocalAdapter), "vault" is a virtual fs in localStorage under
// key `jf-vault-local`. In Electron (NodeFsAdapter), it's a real disk folder.
// React tree never knows the difference.

import { useCallback, useEffect, useRef, useState } from 'react';
import { vault } from '../../adapters/index.js';
import { entryToFile, fileToEntry } from '../../lib/frontmatter.js';
import { VaultError } from '../../adapters/VaultError.js';

const LEGACY_KEY = 'mgn-e';

export function useVault() {
  const [entries, setEntries] = useState([]);
  const [vaultInfo, setVaultInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Skip list tracks files that failed to parse (corruption recovery surface)
  const [issues, setIssues] = useState([]);
  const watchOffRef = useRef(null);

  // Refresh = re-scan vault → reload entries
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const files = await vault.list();
      const loaded = [];
      const badFiles = [];
      for (const f of files) {
        if (f.error) { badFiles.push({ path: f.path, error: f.error }); continue; }
        try {
          const content = await vault.read(f.path);
          const entry = fileToEntry({ path: f.path, content });
          loaded.push(entry);
        } catch (err) {
          badFiles.push({ path: f.path, error: { code: err.code || 'io-error', message: err.message } });
        }
      }
      setEntries(loaded);
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

  const saveEntry = useCallback(async (entry) => {
    const existingByPath = new Set(entries.filter(e => e.id !== entry.id && e._path).map(e => e._path));
    const { path, content } = entryToFile(entry, p => existingByPath.has(p));
    const prev = entries.find(e => e.id === entry.id);
    // If the entry moved (title rename → different slug), remove the old file
    if (prev?._path && prev._path !== path) {
      try { await vault.remove(prev._path); } catch { /* noop if already gone */ }
    }
    await vault.write(path, content);
    const updated = { ...entry, _path: path };
    setEntries(list => {
      const idx = list.findIndex(e => e.id === entry.id);
      if (idx === -1) return [...list, updated];
      const next = [...list];
      next[idx] = updated;
      return next;
    });
    return updated;
  }, [entries]);

  const deleteEntry = useCallback(async (id) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    if (entry._path) {
      try { await vault.remove(entry._path); }
      catch (err) { if (err?.code !== 'not-found') throw err; }
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
