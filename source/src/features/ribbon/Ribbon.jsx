// Left ribbon — quick actions only. Primary navigation lives in the sidebar.
// Each icon dispatches to a single app-level callback. The ribbon itself owns
// no state; App owns the routes.
//
// Position spec:
//   1. Quick Switcher        → onQuickSwitcher()      (Cmd/Ctrl+O)
//   2. New Canvas            → onNewCanvas()
//   3. Daily Note            → onDailyNote()          (Cmd/Ctrl+Shift+D)
//   4. Constellation         → onGraphView()          (Cmd/Ctrl+G)
//   5. Template Library      → onTemplates()
//   6. Command Palette       → onPalette()            (Cmd/Ctrl+P)
//   ├ Settings (pinned bottom)

const ICONS = {
  templates:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  quickSwitch: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="11" cy="14" r="2"/><line x1="13.5" y1="16.5" x2="15" y2="18"/></svg>,
  canvas:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  palette:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  daily:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  graph:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><line x1="7.5" y1="7.5" x2="11" y2="16"/><line x1="16.5" y1="7.5" x2="13" y2="16"/><line x1="8" y1="6" x2="16" y2="6"/></svg>,
  settings:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

function RibbonButton({ icon, tip, onClick, active }) {
  return (
    <button onClick={onClick} aria-label={tip} title={tip}
      style={{
        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? 'var(--ac)' : 'var(--t2)',
        background: active ? 'var(--b2)' : 'transparent',
        borderRadius: 'var(--rd)', cursor: 'pointer', border: 'none', padding: 0,
        transition: 'background 0.12s, color 0.12s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--b2)'; e.currentTarget.style.color = 'var(--tx)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = active ? 'var(--ac)' : 'var(--t2)'; }}>
      <span style={{ width: 18, height: 18, display: 'inline-flex' }}>{icon}</span>
    </button>
  );
}

export function Ribbon({
  activeRoute,
  onTemplates,
  onQuickSwitcher,
  onNewCanvas,
  onPalette,
  onDailyNote,
  onGraphView,
  onSettings,
}) {
  return (
    <aside aria-label="Quick actions ribbon"
      style={{
        width: 48, background: 'var(--sb)', borderRight: '1px solid var(--br)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '8px 0', gap: 4, flexShrink: 0, zIndex: 5,
      }}>
      <RibbonButton icon={ICONS.quickSwitch} tip="Quick Switcher (Ctrl+O)"     onClick={onQuickSwitcher}    active={activeRoute === 'quickswitch'} />
      <RibbonButton icon={ICONS.canvas}      tip="New Canvas"                  onClick={onNewCanvas} />
      <RibbonButton icon={ICONS.daily}       tip="Daily Note (Ctrl+Shift+D)"   onClick={onDailyNote} />
      <RibbonButton icon={ICONS.graph}       tip="Constellation (Ctrl+G)"      onClick={onGraphView}        active={activeRoute === 'graph'} />
      <RibbonButton icon={ICONS.templates}   tip="Template Library"            onClick={onTemplates}        active={activeRoute === 'templates'} />
      <RibbonButton icon={ICONS.palette}     tip="Command Palette (Ctrl+P)"    onClick={onPalette}          active={activeRoute === 'palette'} />
      <div style={{ width: 24, height: 1, background: 'var(--br)', margin: '6px 0' }} />
      <div style={{ marginTop: 'auto' }} />
      <RibbonButton icon={ICONS.settings}    tip="Settings"                    onClick={onSettings} />
    </aside>
  );
}
