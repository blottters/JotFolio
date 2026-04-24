// VaultPicker — first-run modal + settings entry point per wireframe 01.
//
// Two use modes:
//   1. Full-screen first-run overlay (when no vault picked yet + renderer boots)
//   2. Inline card inside Settings > Vault tab (switch vault, view path)
//
// The actual folder picker is delegated to VaultAdapter.pickVault() —
// LocalAdapter returns a virtual path, NodeFsAdapter opens an Electron dialog.

import { useState } from 'react';

export function VaultPicker({ mode = 'modal', vaultInfo, onPick, onMigrate, legacyCount = 0 }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [migrated, setMigrated] = useState(null);

  const doPick = async () => {
    setBusy(true);
    setErr(null);
    try {
      const info = await onPick();
      if (!info) { setBusy(false); return; }
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const doMigrate = async () => {
    setBusy(true);
    setErr(null);
    try {
      const result = await onMigrate();
      setMigrated(result);
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'inline') {
    return (
      <div style={inlineCard}>
        <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Vault</div>
        {vaultInfo ? (
          <>
            <div style={{ fontSize: 13, color: 'var(--tx)', fontFamily: 'var(--fn)', marginBottom: 8, wordBreak: 'break-all' }}>{vaultInfo.path}</div>
            <button onClick={doPick} disabled={busy} style={btn}>Change vault…</button>
            {legacyCount > 0 && !migrated && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 6 }}>
                  You have {legacyCount} entries in browser storage not yet in the vault.
                </div>
                <button onClick={doMigrate} disabled={busy} style={btnPrimary}>Import into vault</button>
              </div>
            )}
            {migrated && (
              <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 10 }}>
                Imported {migrated.migrated} of {migrated.total} entries.
                {migrated.skipped > 0 && ` Skipped ${migrated.skipped}.`}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 8 }}>No vault picked yet.</div>
            <button onClick={doPick} disabled={busy} style={btnPrimary}>Pick a vault folder…</button>
          </>
        )}
        {err && <div role="alert" style={errStyle}>{err}</div>}
      </div>
    );
  }

  // mode === 'modal' — first-run full overlay
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="vault-picker-title"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
      <div style={modalBox}>
        <h2 id="vault-picker-title" style={{ margin: '0 0 8px', fontFamily: 'var(--fn)', fontSize: 22, color: 'var(--tx)' }}>
          📝 Welcome to JotFolio
        </h2>
        <p style={{ fontSize: 14, color: 'var(--t2)', margin: '0 0 20px', lineHeight: 1.55 }}>
          Your notes live on your computer as markdown files in a folder you choose — your <strong>vault</strong>.
          You can open them in any editor. If JotFolio ever disappears, your notes stay yours.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={doPick} disabled={busy} style={btnPrimary}>
            {busy ? 'Opening picker…' : 'Pick a vault folder'}
          </button>
          {legacyCount > 0 && (
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 12, padding: '10px 12px', background: 'var(--b2)', border: '1px solid var(--br)', borderRadius: 'var(--rd)' }}>
              You have {legacyCount} entries stored in this browser. After you pick a vault, we'll offer to import them.
            </div>
          )}
        </div>
        {err && <div role="alert" style={{ ...errStyle, marginTop: 14 }}>{err}</div>}
      </div>
    </div>
  );
}

// ───── Styles ───────────────────────────────────────────────
const inlineCard = {
  padding: 'var(--jf-space-4, 16px)',
  background: 'var(--cd)',
  border: '1px solid var(--br)',
  borderRadius: 'var(--rd)',
};

const btn = {
  padding: '8px 14px',
  fontSize: 13,
  fontFamily: 'var(--fn)',
  background: 'var(--b2)',
  color: 'var(--tx)',
  border: '1px solid var(--br)',
  borderRadius: 'var(--rd)',
  cursor: 'pointer',
};

const btnPrimary = {
  ...btn,
  background: 'var(--ac)',
  color: 'var(--act)',
  border: 'none',
  fontWeight: 700,
};

const modalBox = {
  background: 'var(--bg)',
  border: '1px solid var(--br)',
  borderRadius: 'var(--rd)',
  padding: 28,
  maxWidth: 480,
  width: '90%',
  boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
};

const errStyle = {
  fontSize: 12,
  color: '#ef4444',
  padding: '8px 10px',
  background: 'rgba(239,68,68,0.08)',
  border: '1px solid rgba(239,68,68,0.4)',
  borderRadius: 'var(--rd)',
};
