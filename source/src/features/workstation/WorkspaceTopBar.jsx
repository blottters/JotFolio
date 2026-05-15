const barStyle = {
  height: 60,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '0 24px',
  borderBottom: '1px solid var(--br)',
  background: 'rgba(9,14,20,.98)',
};

const iconButtonStyle = {
  width: 32,
  height: 32,
  border: 'none',
  borderRadius: 8,
  background: 'transparent',
  color: 'var(--t2)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontFamily: 'var(--fn)',
  fontSize: 20,
  lineHeight: 1,
};

function navButtonStyle(enabled) {
  return {
    ...iconButtonStyle,
    opacity: enabled ? 1 : .35,
    cursor: enabled ? 'pointer' : 'default',
  };
}

const utilityButtonStyle = {
  minHeight: 34,
  border: '1px solid var(--br)',
  borderRadius: 8,
  background: 'rgba(255,255,255,.035)',
  color: 'var(--tx)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
  fontFamily: 'var(--fn)',
  fontSize: 13,
  fontWeight: 650,
  padding: '0 14px',
};

function UtilityIcon({ label, children, onClick }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} style={iconButtonStyle}>
      {children}
    </button>
  );
}

export function WorkspaceTopBar({
  query,
  setQuery,
  onCapture,
  onQuickSwitcher,
  onCommandPalette,
  onSearchActivate,
  onNotifications,
  onSettings,
  onBack,
  onForward,
  canGoBack = false,
  canGoForward = false,
  userName = 'Gavin',
}) {
  const initials = String(userName || 'Gavin')
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'G';
  return (
    <header style={barStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 99, background: '#ff5f57', boxShadow: '0 0 0 1px rgba(0,0,0,.24)' }} />
        <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 99, background: '#ffbd2e', boxShadow: '0 0 0 1px rgba(0,0,0,.24)' }} />
        <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 99, background: '#28c840', boxShadow: '0 0 0 1px rgba(0,0,0,.24)' }} />
      </div>

      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--tx)', minWidth: 120 }}>JotFolio</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <button type="button" aria-label="Back" title="Back" onClick={onBack} disabled={!canGoBack} style={navButtonStyle(canGoBack)}>‹</button>
        <button type="button" aria-label="Forward" title="Forward" onClick={onForward} disabled={!canGoForward} style={navButtonStyle(canGoForward)}>›</button>
      </div>

      <div style={{ position: 'relative', width: 'min(460px,42vw)', minWidth: 300 }}>
        <span aria-hidden="true" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', fontSize: 16 }}>⌕</span>
        <input
          aria-label="Search notes, projects, people, tags"
          value={query}
          onFocus={onSearchActivate}
          onChange={event => {
            onSearchActivate?.();
            setQuery?.(event.target.value);
          }}
          onKeyDown={event => {
            if (event.key === 'Escape') setQuery?.('');
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
              event.preventDefault();
              onCommandPalette?.();
            }
          }}
          placeholder="Search notes, projects, people, tags..."
          style={{
            width: '100%',
            height: 36,
            boxSizing: 'border-box',
            padding: '0 54px 0 40px',
            border: '1px solid var(--br)',
            borderRadius: 8,
            background: 'rgba(255,255,255,.035)',
            color: 'var(--tx)',
            outline: 'none',
            fontFamily: 'var(--fn)',
            fontSize: 13,
          }}
        />
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', fontSize: 12 }}>⌘K</span>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button type="button" onClick={onCapture} aria-label="Capture" style={{ ...utilityButtonStyle, minHeight: 36 }}>
          <span aria-hidden="true" style={{ fontSize: 17 }}>⊕</span> Capture
        </button>
        <UtilityIcon label="Quick Actions" onClick={onQuickSwitcher}>⚡</UtilityIcon>
        <UtilityIcon label="Notifications" onClick={onNotifications}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </UtilityIcon>
        <button type="button" aria-label="User profile" title="User profile" onClick={onSettings} style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          border: '1px solid var(--br)',
          background: 'linear-gradient(135deg,#d7a17b,#93c5fd)',
          display: 'grid',
          placeItems: 'center',
          color: '#10141b',
          fontWeight: 850,
          fontSize: 13,
          flexShrink: 0,
          cursor: 'pointer',
        }}>
          {initials}
        </button>
      </div>
    </header>
  );
}
