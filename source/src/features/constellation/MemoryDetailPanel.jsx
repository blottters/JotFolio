import React from 'react';
import { parseFacts } from '../../lib/memory/parseFacts.js';
import { getBacklinks } from '../../lib/index/vaultIndex.js';

/**
 * MemoryDetailPanel — right-side detail view for a selected memory entry
 * (wiki or review). Renders header status, extracted facts, source evidence,
 * a "middle of the job" copy block, and stacked action buttons.
 *
 * Inline styles + CSS variables, no Tailwind. Caller controls outer width.
 *
 * @param {object} props
 * @param {object} props.entry             Memory entry (wiki or review).
 * @param {object} [props.manifest]        Manifest with `entries[id].sources`.
 * @param {object} props.vaultIndex        Vault index w/ `byId` map + helpers.
 * @param {(id: string) => void} props.onConfirm
 * @param {(id: string) => void} props.onSplit
 * @param {(id: string) => void} props.onTraceToSources
 */
export function MemoryDetailPanel({
  entry,
  manifest,
  vaultIndex,
  onConfirm,
  onSplit,
  onTraceToSources,
}) {
  const confidencePct = Math.round((entry?.confidence ?? 0) * 100);
  const isReview = entry?.type === 'review';
  const isConfirmed = entry?.review_status === 'confirmed';
  const isStale = entry?.freshness === 'stale';

  const facts = parseFacts(entry?.notes || '');

  const sourceIds = resolveSourceIds(entry, manifest);

  const statusLine = buildStatusLine(entry);
  const middleCopy = buildMiddleCopy(entry, isReview, isConfirmed);

  const panelStyle = {
    fontFamily: 'var(--fn)',
    color: 'var(--tx)',
    background: 'var(--bg)',
    padding: 'var(--jf-space-4)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--jf-space-4)',
  };

  const headerTitleStyle = {
    fontSize: 15,
    fontWeight: 600,
    margin: 0,
    lineHeight: 1.3,
  };

  const statusStyle = {
    fontSize: 12,
    opacity: 0.85,
    marginTop: 4,
  };

  const chipRowStyle = {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  };

  const confidenceChipStyle = {
    fontSize: 10,
    padding: '2px 8px',
    border: '1px solid var(--br)',
    borderRadius: 'var(--rd)',
    background: 'var(--b2)',
    letterSpacing: '0.05em',
  };

  const staleChipStyle = {
    fontSize: 10,
    padding: '2px 8px',
    border: '1px solid var(--err)',
    borderRadius: 'var(--rd)',
    color: 'var(--err)',
    letterSpacing: '0.1em',
    fontWeight: 600,
  };

  const sectionHeaderStyle = {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    margin: '0 0 8px 0',
    opacity: 0.75,
  };

  const factListStyle = {
    margin: 0,
    paddingLeft: 18,
    fontSize: 13,
    lineHeight: 1.45,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  const sourceItemStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '6px 0',
    borderBottom: '1px solid var(--br)',
    fontSize: 13,
  };

  const typeChipStyle = {
    fontSize: 10,
    padding: '1px 6px',
    border: '1px solid var(--br)',
    borderRadius: 'var(--rd)',
    alignSelf: 'flex-start',
    opacity: 0.8,
  };

  const middleStyle = {
    fontSize: 12,
    lineHeight: 1.5,
    opacity: 0.85,
    fontStyle: 'italic',
  };

  const buttonStackStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const primaryButtonStyle = {
    width: '100%',
    padding: 'var(--jf-space-3)',
    border: '1px solid var(--br)',
    borderRadius: 'var(--rd)',
    background: 'var(--ac)',
    color: 'var(--act)',
    fontFamily: 'var(--fn)',
    fontSize: 13,
    cursor: 'pointer',
  };

  const ghostButtonStyle = {
    width: '100%',
    padding: 'var(--jf-space-3)',
    border: '1px solid var(--br)',
    borderRadius: 'var(--rd)',
    background: 'transparent',
    color: 'var(--tx)',
    fontFamily: 'var(--fn)',
    fontSize: 13,
    cursor: 'pointer',
  };

  return (
    <aside data-memory-detail-panel style={panelStyle} aria-label="Memory detail panel">
      <header>
        <h2 style={headerTitleStyle}>Selected memory: {entry?.title || 'Untitled'}</h2>
        <div style={statusStyle}>{statusLine}</div>
        <div style={chipRowStyle}>
          <span style={confidenceChipStyle} data-testid="confidence-chip">
            confidence {confidencePct}%
          </span>
          {isStale && (
            <span style={staleChipStyle} data-testid="stale-chip">
              STALE
            </span>
          )}
        </div>
      </header>

      <section data-section="facts">
        <h3 style={sectionHeaderStyle}>Facts held by this node</h3>
        {facts.length === 0 ? (
          <p style={{ fontSize: 13, fontStyle: 'italic', opacity: 0.7, margin: 0 }}>
            No facts extracted from compiled body.
          </p>
        ) : (
          <ul style={factListStyle}>
            {facts.map((fact, i) => (
              <li key={i}>{fact}</li>
            ))}
          </ul>
        )}
      </section>

      <section data-section="sources">
        <h3 style={sectionHeaderStyle}>Source evidence</h3>
        {sourceIds.length === 0 ? (
          <p style={{ fontSize: 13, fontStyle: 'italic', opacity: 0.7, margin: 0 }}>
            No tracked sources.
          </p>
        ) : (
          <div>
            {sourceIds.map((sourceId) => {
              const source = vaultIndex?.byId?.get?.(sourceId);
              if (!source) {
                return (
                  <div key={sourceId} style={sourceItemStyle} data-source-missing>
                    <em>Source missing (id: {sourceId})</em>
                  </div>
                );
              }
              const backlinkCount = countBacklinks(vaultIndex, entry?.id);
              return (
                <div key={sourceId} style={sourceItemStyle} data-source-id={sourceId}>
                  <strong>{source.title}</strong>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>
                    linked {backlinkCount} {backlinkCount === 1 ? 'time' : 'times'}
                  </span>
                  {source.type && <span style={typeChipStyle}>{source.type}</span>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section data-section="middle">
        <p style={middleStyle}>{middleCopy}</p>
      </section>

      <div style={buttonStackStyle}>
        <button
          type="button"
          aria-label="Confirm memory"
          style={primaryButtonStyle}
          onClick={() => typeof onConfirm === 'function' && onConfirm(entry?.id)}
        >
          Confirm memory
        </button>
        <button
          type="button"
          aria-label="Split into smaller memories"
          style={ghostButtonStyle}
          onClick={() => typeof onSplit === 'function' && onSplit(entry?.id)}
        >
          Split into smaller memories
        </button>
        <button
          type="button"
          aria-label="Trace claims to sources"
          style={ghostButtonStyle}
          onClick={() =>
            typeof onTraceToSources === 'function' && onTraceToSources(entry?.id)
          }
        >
          Trace claims to sources
        </button>
      </div>
    </aside>
  );
}

function resolveSourceIds(entry, manifest) {
  const fromManifest = manifest?.entries?.[entry?.id]?.sources;
  if (Array.isArray(fromManifest) && fromManifest.length > 0) return fromManifest;
  if (Array.isArray(entry?.provenance)) return entry.provenance;
  return [];
}

function countBacklinks(vaultIndex, id) {
  if (!vaultIndex || !id) return 0;
  if (typeof vaultIndex.getBacklinks === 'function') {
    const result = vaultIndex.getBacklinks(vaultIndex, id);
    return Array.isArray(result) ? result.length : 0;
  }
  try {
    const result = getBacklinks(vaultIndex, id);
    return Array.isArray(result) ? result.length : 0;
  } catch {
    return 0;
  }
}

function buildStatusLine(entry) {
  if (!entry) return 'Status: no entry';
  if (entry.review_status === 'confirmed') {
    const n = Array.isArray(entry.provenance) ? entry.provenance.length : 0;
    return `Status: confirmed - verified against ${n} source notes`;
  }
  if (entry.type === 'review') {
    return `Status: needs review - last confirmed ${entry.valid_from || 'never'}`;
  }
  return `Status: ${entry.review_status || 'no status'}`;
}

function buildMiddleCopy(entry, isReview, isConfirmed) {
  if (isReview) {
    return 'The user is reviewing whether this synthesized memory is still true. They can confirm it, split it, or trace claims back to source notes.';
  }
  if (entry?.type === 'wiki' && isConfirmed) {
    return 'This memory is trusted. Re-confirm to refresh, split if too broad, or trace claims to verify.';
  }
  return 'Wiki memory awaiting first confirmation pass.';
}
