// Settings > Privacy tab. Controls the telemetry opt-in + shows what gets sent.

import { useState, useEffect } from 'react';
import { userOptedIn, setOptIn, hasDecided } from '../../lib/telemetry.js';

export function PrivacyPanel() {
  const [enabled, setEnabled] = useState(userOptedIn());
  const [decided, setDecided] = useState(hasDecided());

  useEffect(() => {
    setEnabled(userOptedIn());
    setDecided(hasDecided());
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setOptIn(next);
    setDecided(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>
        JotFolio can send anonymous crash reports to help fix bugs. You can turn this off any time. It's off by default.
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>Send crash reports</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
              {enabled ? 'On — crashes are sent anonymously.' : 'Off — nothing is sent.'}
            </div>
          </div>
          <button onClick={toggle} aria-pressed={enabled} style={toggleBtn(enabled)}>
            <span style={{ position: 'absolute', top: 2, left: enabled ? 20 : 2, width: 18, height: 18, borderRadius: 9, background: enabled ? 'var(--act)' : 'var(--t3)', transition: 'left 0.2s' }} />
          </button>
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.6 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>What gets sent</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Exception type + stack trace</li>
          <li>App version + OS name + OS version</li>
          <li>Last ~100 user actions (button clicks, view changes) — no content</li>
          <li>Anonymous install ID (random, not your identity)</li>
        </ul>
      </div>

      <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.6 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>What never gets sent</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>Note contents or titles</li>
          <li>Vault folder path</li>
          <li>File paths (stripped to basename)</li>
          <li>Email, name, IP address</li>
          <li>API keys, tokens, plugin secrets</li>
        </ul>
      </div>

      {!decided && (
        <div style={{ fontSize: 12, color: 'var(--t2)', padding: '10px 12px', background: 'var(--b2)', border: '1px solid var(--br)', borderRadius: 'var(--rd)' }}>
          You haven't decided yet. Choosing explicitly (even "off") makes this dismiss.
        </div>
      )}
    </div>
  );
}

const card = {
  padding: 12,
  background: 'var(--cd)',
  border: '1px solid var(--br)',
  borderRadius: 'var(--rd)',
};

const toggleBtn = (on) => ({
  width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
  background: on ? 'var(--ac)' : 'var(--br)', position: 'relative', transition: 'background 0.2s',
});
