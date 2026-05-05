// Overlay state cards for Constellation: locked / empty / no-matches.
// Source: docs/mockups/constellation-redesign StateOverlay (lines 355-420).
// Renders nothing for any other state value.

const wrapStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none'
};

const cardStyle = {
  pointerEvents: 'auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  textAlign: 'center',
  maxWidth: 400,
  padding: 32,
  fontFamily: 'var(--jf-font-sans)'
};

const glyphStyle = {
  fontFamily: 'var(--jf-font-display)',
  fontSize: 56,
  color: 'var(--ac)',
  lineHeight: 1,
  marginBottom: 4
};

const headStyle = {
  fontFamily: 'var(--jf-font-display)',
  fontSize: 22,
  fontWeight: 400,
  color: 'var(--tx)',
  letterSpacing: '-0.005em'
};

const subStyle = {
  fontSize: 13,
  color: 'var(--t2)',
  maxWidth: 320,
  lineHeight: 1.5
};

const primaryBtnStyle = {
  height: 32,
  padding: '0 16px',
  marginTop: 4,
  background: 'var(--ac)',
  color: 'var(--act)',
  border: 'none',
  fontFamily: 'var(--jf-font-sans)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  borderRadius: 'var(--rd)'
};

const ghostBtnStyle = {
  height: 32,
  padding: '0 14px',
  background: 'transparent',
  color: 'var(--t2)',
  border: '1px solid var(--br)',
  fontFamily: 'var(--jf-font-sans)',
  fontSize: 12,
  cursor: 'pointer',
  borderRadius: 'var(--rd)'
};

const codeStyle = {
  fontFamily: 'var(--jf-font-mono)',
  background: 'var(--sb)',
  padding: '1px 6px',
  fontSize: 12
};

function Shell({ children }) {
  return (
    <div style={wrapStyle} role="status" aria-live="polite">
      <div style={cardStyle}>{children}</div>
    </div>
  );
}

function Glyph() {
  return <div style={glyphStyle} aria-hidden="true">✦</div>;
}

export function ConstellationStateOverlay({ state, count, onAdd, onReset }) {
  if (state === 'locked') {
    return (
      <Shell>
        <Glyph />
        <div style={headStyle}>Graph unlocks at 3 entries.</div>
        <div style={subStyle}>You have {count}.</div>
        <button
          type="button"
          style={primaryBtnStyle}
          onClick={onAdd}
          aria-label="Add another entry"
        >
          + Add another
        </button>
      </Shell>
    );
  }

  if (state === 'empty') {
    return (
      <Shell>
        <Glyph />
        <div style={headStyle}>Nothing's connected yet.</div>
        <div style={subStyle}>
          Add a few <code style={codeStyle}>[[links]]</code> between entries to see them appear here.
        </div>
      </Shell>
    );
  }

  if (state === 'no-matches') {
    return (
      <Shell>
        <Glyph />
        <div style={headStyle}>No entries match this filter.</div>
        <div style={subStyle}>Adjust the filters above, or reset.</div>
        <button
          type="button"
          style={ghostBtnStyle}
          onClick={onReset}
          aria-label="Reset filters"
        >
          Reset filters
        </button>
      </Shell>
    );
  }

  return null;
}
