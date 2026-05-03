import { useEffect, useState } from 'react';
import { version as APP_VERSION } from '../../../package.json';

const sH = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 2,
  color: 'var(--t3)',
  textTransform: 'uppercase',
  marginBottom: 8,
  marginTop: 16,
  display: 'block',
};

const card = {
  padding: 12,
  background: 'var(--cd)',
  border: '1px solid var(--br)',
  borderRadius: 'var(--rd)',
};

function statusText(status, checking) {
  if (checking) return 'Checking';
  if (!status) return 'Idle';
  if (status.state === 'checking') return 'Checking';
  if (status.state === 'current') return 'Current';
  if (status.state === 'available') return `Available ${status.version || ''}`.trim();
  if (status.state === 'downloading') return `Downloading ${status.percent || 0}%`;
  if (status.state === 'ready') return `Ready ${status.version || ''}`.trim();
  if (status.state === 'error') return 'Error';
  return status.state || 'Idle';
}

export function UpdatesPanel() {
  const updater = typeof window !== 'undefined' ? window.electron?.updater : null;
  const isDesktop = !!updater?.check;
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [checkError, setCheckError] = useState('');

  useEffect(() => {
    if (!updater?.onStatus) return undefined;
    return updater.onStatus(payload => {
      setStatus(payload);
      setLastChecked(new Date());
      if (payload?.state === 'error') setCheckError(payload.message || 'Update check failed');
      else setCheckError('');
    });
  }, [updater]);

  const checkNow = async () => {
    if (!updater?.check) return;
    setChecking(true);
    setCheckError('');
    try {
      const result = await updater.check();
      setLastChecked(new Date());
      if (result?.ok === false) {
        setStatus({ state: 'error', message: result.error || 'Update check failed' });
        setCheckError(result.error || 'Update check failed');
      } else if (result?.info?.version) {
        setStatus({ state: 'available', version: result.info.version });
      } else {
        setStatus({ state: 'current' });
      }
    } catch (err) {
      setStatus({ state: 'error', message: err.message || 'Update check failed' });
      setCheckError(err.message || 'Update check failed');
    } finally {
      setChecking(false);
    }
  };

  const restartNow = async () => {
    try { await updater?.installNow?.(); }
    catch (err) { setCheckError(err.message || 'Restart failed'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
      <span style={sH}>Installed version</span>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>JotFolio</span>
          <span style={{ fontSize: 12, color: 'var(--t2)', fontFamily: 'monospace' }}>v{APP_VERSION}</span>
        </div>
      </div>

      <span style={sH}>Update status</span>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: status?.state === 'error' ? '#ef4444' : 'var(--tx)' }}>
              {isDesktop ? statusText(status, checking) : 'Desktop only'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
              {lastChecked ? `Last checked ${lastChecked.toLocaleTimeString()}` : 'No check in this session'}
            </div>
          </div>
          <button
            onClick={checkNow}
            disabled={!isDesktop || checking}
            style={{
              padding: '7px 12px',
              fontSize: 12,
              border: '1px solid var(--br)',
              borderRadius: 'var(--rd)',
              background: isDesktop ? 'var(--ac)' : 'var(--b2)',
              color: isDesktop ? 'var(--act)' : 'var(--t3)',
              cursor: isDesktop && !checking ? 'pointer' : 'default',
              fontFamily: 'var(--fn)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}>
            {checking ? 'Checking' : 'Check now'}
          </button>
        </div>
        {status?.state === 'ready' && (
          <button onClick={restartNow} style={{ marginTop: 10, width: '100%', padding: '8px 12px', fontSize: 12, border: 'none', borderRadius: 'var(--rd)', background: 'var(--ac)', color: 'var(--act)', cursor: 'pointer', fontFamily: 'var(--fn)', fontWeight: 700 }}>
            Restart now
          </button>
        )}
        {(checkError || status?.message) && (
          <div role="alert" style={{ marginTop: 10, fontSize: 11, color: '#ef4444', lineHeight: 1.5 }}>
            {checkError || status.message}
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5 }}>
        Packaged desktop builds check shortly after launch and then while the app stays open. Browser preview does not run the desktop updater.
      </div>
    </div>
  );
}
