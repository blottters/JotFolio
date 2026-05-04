import React from 'react';

/**
 * MemoryNode — renders wiki/review memory entries as nodes inside the
 * Constellation graph. Inline styles + CSS variables, no Tailwind.
 *
 * @param {object} props
 * @param {{
 *   id: string,
 *   title: string,
 *   notes?: string,
 *   confidence?: number,
 *   type: 'wiki' | 'review',
 *   freshness?: 'fresh' | 'stale'
 * }} props.entry
 * @param {boolean} [props.isSelected]
 * @param {(id: string) => void} props.onSelect
 */
export function MemoryNode({ entry, isSelected = false, onSelect }) {
  const confidencePct = Math.round((entry.confidence ?? 0) * 100);
  const isReview = entry.type === 'review';
  const isStale = entry.freshness === 'stale';

  const firstSentence = extractFirstSentence(entry.notes);
  const snippet = truncate(firstSentence, 60);

  const metaBase = `memory · ${confidencePct}% · ${entry.type}`;
  const meta = isStale ? `${metaBase} · stale` : metaBase;

  const ariaLabel = `Memory node: ${entry.title}, confidence ${confidencePct}%, ${entry.type}`;

  function handleSelect() {
    if (typeof onSelect === 'function') onSelect(entry.id);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect();
    }
  }

  const style = {
    width: 160,
    height: 110,
    padding: 'var(--jf-space-3)',
    borderRadius: 'var(--rd)',
    border: `2px solid ${isSelected ? 'var(--ac)' : 'var(--br)'}`,
    background: isReview ? 'var(--b2)' : 'var(--cd)',
    opacity: isStale ? 0.7 : 1,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    overflow: 'hidden',
  };

  const titleStyle = {
    fontFamily: 'var(--fn)',
    fontSize: 13,
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const snippetStyle = {
    fontSize: 11,
    lineHeight: 1.3,
    opacity: 0.85,
    display: 'block',
  };

  const metaStyle = {
    fontSize: 10,
    opacity: 0.7,
    display: 'block',
    marginTop: 4,
  };

  return (
    <div
      data-memory-node
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={ariaLabel}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      style={style}
    >
      <strong style={titleStyle}>{entry.title}</strong>
      {snippet && <small style={snippetStyle}>{snippet}</small>}
      <small style={metaStyle}>{meta}</small>
    </div>
  );
}

function extractFirstSentence(notes) {
  if (!notes || typeof notes !== 'string') return '';
  const trimmed = notes.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^[^.!?]*[.!?]/);
  return match ? match[0].trim() : trimmed;
}

function truncate(text, max) {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}
