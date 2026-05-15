// Overlay state cards for Constellation: locked / empty / no-matches / error.
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
  gap: 14,
  textAlign: 'center',
  maxWidth: 400,
  padding: '30px 34px',
  fontFamily: 'var(--jf-font-sans)'
};

const glyphStyle = {
  width: 50,
  height: 50,
  borderRadius: '50%',
  border: '1px solid var(--br)',
  display: 'grid',
  placeItems: 'center',
  fontFamily: 'var(--jf-font-mono)',
  fontSize: 24,
  color: 'var(--ac)',
  lineHeight: 1,
  marginBottom: 2,
  background: 'var(--b2)'
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
  maxWidth: 340,
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

function Shell({ children, tone = 'status' }) {
  return (
    <div
      style={wrapStyle}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      <div style={cardStyle}>{children}</div>
    </div>
  );
}

function Glyph() {
  return <div style={glyphStyle} aria-hidden="true">⌁</div>;
}

export function ConstellationStateOverlay({ state, count, onAdd, onReset, message }) {
  if (state === 'locked') {
    return (
      <Shell>
        <Glyph />
        <div style={headStyle}>Graph unlocks at 3 entries.</div>
        <div style={subStyle}>You have {count}. Add one more note when the vault is ready to show real relationships.</div>
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
          Add <code style={codeStyle}>[[links]]</code>, backlinks, or memory sources between entries and the map will start to form.
        </div>
      </Shell>
    );
  }

  if (state === 'no-matches') {
    return (
      <Shell>
        <Glyph />
        <div style={headStyle}>No entries match this filter.</div>
        <div style={subStyle}>The graph is intact. This filter combination is just hiding every node.</div>
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

  if (state === 'error') {
    return (
      <Shell tone="error">
        <Glyph />
        <div style={headStyle}>Constellation could not render.</div>
        <div style={subStyle}>
          {message || 'Reload the graph after the vault finishes indexing. Your notes are not changed by this view.'}
        </div>
      </Shell>
    );
  }

  return null;
}
