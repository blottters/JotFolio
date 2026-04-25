import { wordCountSummary } from './wordCountStats.js';

// Render function for the Word Count plugin's sidebar panel. The plugin
// registers `render: ({entries}) => renderWordCountPanel({entries})` so
// the React subtree comes from the plugin module, not from App.

export function renderWordCountPanel({ entries }) {
  const summary = wordCountSummary(entries);
  const types = Object.entries(summary.perType).sort((a, b) => b[1] - a[1]);
  return (
    <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--t2)' }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
        color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 6,
      }}>Word Count</div>
      <div style={{ marginBottom: 6, color: 'var(--tx)', fontWeight: 700 }}>
        {summary.totalWords.toLocaleString()} words
      </div>
      <div style={{ marginBottom: 8 }}>across {summary.entryCount} entries</div>
      {types.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {types.map(([type, count]) => (
            <div key={type} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--t3)' }}>{type}</span>
              <span style={{ fontFamily: 'monospace' }}>{count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
