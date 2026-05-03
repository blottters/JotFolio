import { useState, useEffect } from "react";

// Persistent banner that appears when electron-updater finishes
// downloading a new version. Click "Restart now" to apply immediately
// (calls quitAndInstall via the IPC bridge); click × to dismiss until
// the next update lands.
//
// Wraps window.electron?.updater — gracefully no-ops in browser-vault
// mode where there is no Electron main process. Also no-ops during dev
// because main-process updater.js bails when !app.isPackaged.

export function UpdateBanner() {
  const [status, setStatus] = useState(null);     // last status payload from main
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const updater = typeof window !== 'undefined' ? window.electron?.updater : null;
    if (!updater?.onStatus) return undefined;
    const off = updater.onStatus(payload => {
      setStatus(payload);
      // Re-show on a fresh ready event even if the user dismissed an
      // older one — version mismatch means new update.
      setDismissed(d => (payload?.state === 'ready' ? false : d));
    });
    return off;
  }, []);

  if (!status || dismissed) return null;
  if (status.state !== 'ready' && status.state !== 'downloading') return null;

  const isReady = status.state === 'ready';
  const handleRestart = async () => {
    try { await window.electron?.updater?.installNow?.(); }
    catch (err) { console.error('install-now failed', err); }
  };

  return (
    <div role="status" aria-live="polite" style={{
      position: 'fixed', bottom: 14, right: 14, zIndex: 220,
      maxWidth: 360, padding: '12px 14px',
      background: 'var(--bg)',
      border: '1px solid var(--ac)',
      borderRadius: 'var(--rd)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
      color: 'var(--tx)', fontSize: 12,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: isReady ? 'var(--ac)' : 'var(--b2)',
          color: isReady ? 'var(--act)' : 'var(--t2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, flexShrink: 0,
        }}>{isReady ? '↓' : '⋯'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>
            {isReady
              ? `Update ${status.version || ''} ready`
              : `Downloading ${status.percent || 0}%`}
          </div>
          <div style={{ color: 'var(--t2)', lineHeight: 1.5 }}>
            {isReady
              ? 'Restart now to install, or it will install automatically the next time you quit.'
              : `${status.transferredMB || '?'} / ${status.totalMB || '?'} MB`}
          </div>
        </div>
        <button onClick={() => setDismissed(true)} aria-label="Dismiss"
          style={{
            background: 'transparent', border: 'none', color: 'var(--t3)',
            cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1,
          }}>×</button>
      </div>
      {isReady && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button onClick={() => setDismissed(true)} style={{
            padding: '5px 10px', fontSize: 11,
            background: 'transparent', color: 'var(--t2)',
            border: '1px solid var(--br)', borderRadius: 'var(--rd)',
            cursor: 'pointer', fontFamily: 'var(--fn)',
          }}>Later</button>
          <button onClick={handleRestart} style={{
            padding: '5px 12px', fontSize: 11,
            background: 'var(--ac)', color: 'var(--act)',
            border: 'none', borderRadius: 'var(--rd)',
            cursor: 'pointer', fontFamily: 'var(--fn)', fontWeight: 700,
          }}>Restart now</button>
        </div>
      )}
    </div>
  );
}
