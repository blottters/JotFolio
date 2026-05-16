import { useEscapeKey } from '../../lib/hooks.js';

export function EntryFileDialog({ request, onChange, onClose, onSubmit }) {
  useEscapeKey(Boolean(request), onClose, { includeEditableTargets: true });
  if (!request) return null;
  const isMove = request.kind === 'move';
  const title = isMove ? 'Move entry file' : 'Rename entry file';
  const label = isMove ? 'Vault folder' : 'File name';
  const help = isMove
    ? 'Use a vault-relative folder path. Leave blank to move the file to the vault root.'
    : 'Keep the .md extension so the entry remains a plain Markdown file.';
  const placeholder = isMove ? 'notes/projects' : 'Roadmap.md';
  const buttonLabel = isMove ? 'Move file' : 'Rename file';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-file-dialog-title"
      style={{ position: 'absolute', inset: 0, zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,10,16,.62)', backdropFilter: 'blur(2px)' }}
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <form
        onSubmit={event => { event.preventDefault(); onSubmit(request.value); }}
        style={{ width: 'min(430px,calc(100vw - 32px))', background: 'var(--bg)', border: '1px solid var(--br)', borderRadius: 'calc(var(--rd) + 6px)', boxShadow: '0 24px 80px rgba(0,0,0,.34)', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div id="entry-file-dialog-title" style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx)', marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.45 }}>{help}</div>
          {request.path && <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 11, color: 'var(--t3)', wordBreak: 'break-all' }}>{request.path}</div>}
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--t3)' }}>
          {label}
          <input
            autoFocus
            value={request.value}
            onChange={event => onChange(event.target.value)}
            placeholder={placeholder}
            style={{ fontFamily: 'var(--fn)', fontSize: 14, color: 'var(--tx)', background: 'var(--b1)', border: '1px solid var(--br)', borderRadius: 'var(--rd)', padding: '10px 12px', outline: 'none' }} />
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ fontFamily: 'var(--fn)', fontSize: 13, padding: '8px 12px', border: '1px solid var(--br)', borderRadius: 'var(--rd)', background: 'var(--b1)', color: 'var(--t2)', cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            type="submit"
            style={{ fontFamily: 'var(--fn)', fontSize: 13, padding: '8px 12px', border: '1px solid var(--ac)', borderRadius: 'var(--rd)', background: 'var(--ac)', color: 'var(--act)', fontWeight: 800, cursor: 'pointer' }}>
            {buttonLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
