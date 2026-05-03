// Settings > Plugins tab. Per wireframe 10.
// Lists discovered plugins, toggles enable, shows permission summary, uninstalls.
// Installs official plugins via installOfficial().

import { useEffect, useState, useCallback } from 'react';
import { pluginHost } from '../../plugins/PluginHost.js';
import { OFFICIAL_PLUGINS, installOfficial } from '../../plugins/officialPlugins.js';

export function PluginsPanel() {
  const [plugins, setPlugins] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [pendingUninstall, setPendingUninstall] = useState(null);

  const refresh = useCallback(async () => {
    setBusy(true); setErr(null);
    try {
      await pluginHost.discover();
      setPlugins(pluginHost.list());
    } catch (e) { setErr(e?.message || String(e)); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => {
    refresh();
    return pluginHost.subscribe(setPlugins);
  }, [refresh]);

  const install = async (id) => {
    setBusy(true); setErr(null);
    try {
      await installOfficial(id);
      await pluginHost.discover();
    } catch (e) { setErr(e?.message || String(e)); }
    finally { setBusy(false); }
  };

  const toggle = async (rec) => {
    setBusy(true); setErr(null);
    try {
      if (rec.status === 'enabled') await pluginHost.disable(rec.manifest.id);
      else await pluginHost.enable(rec.manifest.id);
    } catch (e) { setErr(e?.message || String(e)); }
    finally { setBusy(false); }
  };

  const uninstall = async (id) => {
    setBusy(true); setErr(null);
    try { await pluginHost.uninstall(id); }
    catch (e) { setErr(e?.message || String(e)); }
    finally { setBusy(false); setPendingUninstall(null); }
  };

  const installedIds = new Set(plugins.map(p => p.manifest.id));
  const notYetInstalled = OFFICIAL_PLUGINS.filter(p => !installedIds.has(p.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>
        Plugins live in <code>&lt;vault&gt;/.jotfolio/plugins/</code>. They run inside the app with the permissions declared in their manifest.
      </div>
      {err && <div role="alert" style={errStyle}>{err}</div>}

      {plugins.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--t3)' }}>No plugins installed.</div>
      )}

      {plugins.map(rec => (
        <div key={rec.manifest.id} style={row(rec.status === 'failed')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>
                {rec.manifest.name} <span style={{ fontWeight: 400, color: 'var(--t3)', fontSize: 11 }}>v{rec.manifest.version}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                {rec.manifest.description || '—'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4 }}>
                Permissions: {permissionSummary(rec.manifest.permissions)}
              </div>
            </div>
            <button type="button" onClick={() => toggle(rec)} disabled={busy || rec.status === 'failed'}
              style={toggleBtn(rec.status === 'enabled')} aria-pressed={rec.status === 'enabled'}>
              <span style={{ position: 'absolute', top: 2, left: rec.status === 'enabled' ? 20 : 2, width: 18, height: 18, borderRadius: 9, background: rec.status === 'enabled' ? 'var(--act)' : 'var(--t3)', transition: 'left 0.2s' }} />
            </button>
          </div>
          {rec.status === 'failed' && (
            <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>⚠ {rec.error}</div>
          )}
          {pendingUninstall === rec.manifest.id ? (
            <div role="group" aria-label={`Confirm uninstall ${rec.manifest.name}`} style={confirmRow}>
              <span style={{ flex: 1, fontSize: 11, color: 'var(--t2)' }}>
                Remove files from <code>.jotfolio/plugins/{rec.manifest.id}/</code>?
              </span>
              <button type="button" onClick={() => uninstall(rec.manifest.id)} disabled={busy} style={dangerBtn}>
                Remove
              </button>
              <button type="button" onClick={() => setPendingUninstall(null)} disabled={busy} style={smallBtn}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button type="button" onClick={() => setPendingUninstall(rec.manifest.id)} disabled={busy} style={smallBtn}>
                Uninstall
              </button>
            </div>
          )}
        </div>
      ))}

      {notYetInstalled.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 12, marginBottom: 4 }}>
            Official plugins
          </div>
          {notYetInstalled.map(p => (
            <div key={p.id} style={row(false)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>
                    {p.name} <span style={{ fontWeight: 400, color: 'var(--t3)', fontSize: 11 }}>v{p.version}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{p.description}</div>
                </div>
                <button type="button" onClick={() => install(p.id)} disabled={busy} style={installBtn}>
                  Install
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function permissionSummary(perms = {}) {
  const bits = [];
  if (perms.vault_read) bits.push('vault read');
  if (perms.vault_write) bits.push('vault write');
  if (perms.http_domains?.length) bits.push(`http: ${perms.http_domains.join(', ')}`);
  return bits.length ? bits.join(' · ') : 'none';
}

const row = (failed) => ({
  padding: 10,
  background: 'var(--cd)',
  border: '1px solid ' + (failed ? '#ef4444' : 'var(--br)'),
  borderRadius: 'var(--rd)',
});
const toggleBtn = (on) => ({
  width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
  background: on ? 'var(--ac)' : 'var(--br)', position: 'relative', transition: 'background 0.2s',
});
const smallBtn = {
  padding: '3px 10px', fontSize: 11, background: 'transparent', border: '1px solid var(--br)',
  borderRadius: 'var(--rd)', color: 'var(--t2)', cursor: 'pointer', fontFamily: 'var(--fn)',
};
const confirmRow = {
  display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap',
  padding: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)',
  borderRadius: 'var(--rd)',
};
const dangerBtn = {
  padding: '3px 10px', fontSize: 11, background: '#ef4444', border: '1px solid #ef4444',
  borderRadius: 'var(--rd)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--fn)', fontWeight: 700,
};
const installBtn = {
  padding: '4px 12px', fontSize: 12, background: 'var(--ac)', color: 'var(--act)', border: 'none',
  borderRadius: 'var(--rd)', cursor: 'pointer', fontFamily: 'var(--fn)', fontWeight: 700,
};
const errStyle = {
  fontSize: 12, color: '#ef4444', padding: '8px 10px',
  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 'var(--rd)',
};
