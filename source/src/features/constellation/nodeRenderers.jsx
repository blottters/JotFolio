import React from 'react';
import { applyTypeSat } from '../../lib/types.js';

// ────────────────────────────────────────────────────────────────────────────
// Constellation node renderers — three pure SVG-fragment variants.
//
// Each component renders a `<g>` group (must be nested inside an `<svg>`).
// They are intentionally controlled — all interaction state (hovered, focal,
// dimmed) is passed in by the parent. No useState / useEffect.
//
// Source: extracted + simplified from the design pack at
// jf-design-pack/constellation-redesign/project/Constellation.jsx
// (StarNode, BoardNode, EditorialNode in that file).
// ────────────────────────────────────────────────────────────────────────────

const SIZE_FOR_LINKS = (links) => 4 + Math.sqrt(links || 0) * 4;

/**
 * Star chart node — luminous cream point with optional halo.
 * Labels appear on hover, focal, or starred.
 *
 * @param {object} props.n - node data { id, x, y, type, links, title, starred, ghost }
 * @param {string} props.saturation - 'full' | 'muted' | 'mono'
 * @param {boolean} props.hovered
 * @param {boolean} props.focal
 * @param {boolean} props.dimmed - faded when graph has a focal target and this isn't a neighbor
 * @param {function} props.onHover - (id|null) => void
 * @param {function} props.onClick - (n) => void
 * @param {'always'|'hover'|'zoom'} props.labelPolicy - default 'hover'
 * @param {number} props.viewK - current zoom level (for 'zoom' policy)
 */
export function StarNode({
  n,
  saturation = 'full',
  hovered = false,
  focal = false,
  dimmed = false,
  onHover,
  onClick,
  labelPolicy = 'hover',
  viewK = 1,
}) {
  const r = SIZE_FOR_LINKS(n.links);
  const color = applyTypeSat(n.type, saturation);
  const opacity = dimmed ? 0.4 : 1;
  const showLabel =
    labelPolicy === 'always' ||
    (labelPolicy === 'hover' && (hovered || focal)) ||
    (labelPolicy === 'zoom' && viewK > 0.85) ||
    n.starred ||
    focal;

  return (
    <g
      data-node-variant="star"
      data-node-id={n.id}
      transform={`translate(${n.x}, ${n.y})`}
      opacity={opacity}
      onMouseEnter={() => onHover && onHover(n.id)}
      onMouseLeave={() => onHover && onHover(null)}
      onClick={() => onClick && onClick(n)}
      style={{ cursor: 'pointer' }}
    >
      {!n.ghost && (hovered || focal) && (
        <circle r={r * 2.6} fill={color} opacity={0.18} />
      )}
      {n.starred && (
        <circle
          r={r + 6}
          fill="none"
          stroke="var(--ac)"
          strokeWidth={0.75}
          opacity={0.55}
        />
      )}
      {n.ghost ? (
        <circle
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={1}
          strokeDasharray="2 3"
          opacity={0.7}
        />
      ) : (
        <circle r={r} fill={color} />
      )}
      {(hovered || focal) && !n.ghost && (
        <circle
          r={r + 3}
          fill="none"
          stroke="var(--ac)"
          strokeWidth={0.75}
          opacity={0.7}
        />
      )}
      {showLabel && n.title && (
        <text
          x={0}
          y={r + 14}
          textAnchor="middle"
          fontFamily="var(--jf-font-sans)"
          fontSize={11}
          fontWeight={focal ? 600 : 400}
          fill={n.ghost ? 'var(--t3)' : 'var(--t2)'}
          fontStyle={n.ghost ? 'italic' : 'normal'}
          style={{
            paintOrder: 'stroke',
            stroke: 'var(--bg)',
            strokeWidth: 3,
            strokeLinejoin: 'round',
          }}
        >
          {n.title}
        </text>
      )}
    </g>
  );
}

/**
 * Detective board node — dark index card with cream title + meta line.
 * Type-color strip on the left edge. Hub nodes (>=4 links) get bolder title.
 * Card stays dark (#1c1b1a fill, cream text) per chat-decided contrast fix.
 */
export function BoardNode({
  n,
  saturation = 'full',
  hovered = false,
  focal = false,
  dimmed = false,
  onHover,
  onClick,
}) {
  const color = applyTypeSat(n.type, saturation);
  const w = 144;
  const h = 44;
  const opacity = dimmed ? 0.4 : 1;
  const isHub = (n.links || 0) >= 4;
  const rawTitle = n.title || '';
  const displayTitle =
    rawTitle.length > 22 ? rawTitle.slice(0, 21) + '…' : rawTitle;

  return (
    <g
      data-node-variant="board"
      data-node-id={n.id}
      transform={`translate(${n.x - w / 2}, ${n.y - h / 2})`}
      opacity={opacity}
      onMouseEnter={() => onHover && onHover(n.id)}
      onMouseLeave={() => onHover && onHover(null)}
      onClick={() => onClick && onClick(n)}
      style={{ cursor: 'pointer' }}
    >
      <rect
        data-node-card
        width={w}
        height={h}
        fill={n.ghost ? 'transparent' : '#1c1b1a'}
        stroke={color}
        strokeWidth={1}
        strokeDasharray={n.ghost ? '3 3' : null}
      />
      {!n.ghost && (
        <rect
          data-node-strip
          x={0}
          y={0}
          width={3}
          height={h}
          fill={color}
        />
      )}
      {n.starred && (
        <rect
          data-node-starred
          x={-2}
          y={-2}
          width={w + 4}
          height={h + 4}
          fill="none"
          stroke="#F1EADE"
          strokeWidth={0.75}
          opacity={0.7}
        />
      )}
      {(hovered || focal) && (
        <rect
          data-node-focus
          x={-1}
          y={-1}
          width={w + 2}
          height={h + 2}
          fill="none"
          stroke="#F1EADE"
          strokeWidth={1}
        />
      )}
      <text
        data-node-title
        x={10}
        y={18}
        fontFamily="var(--jf-font-display)"
        fontSize={12}
        fontWeight={isHub ? 600 : 500}
        fontStyle={n.ghost ? 'italic' : 'normal'}
        fill={n.ghost ? 'rgba(241,234,222,0.45)' : '#F1EADE'}
      >
        {displayTitle}
      </text>
      <text
        data-node-meta
        x={10}
        y={34}
        fontFamily="var(--jf-font-sans)"
        fontSize={10}
        fill={n.ghost ? 'rgba(241,234,222,0.3)' : 'rgba(241,234,222,0.5)'}
        letterSpacing="0.06em"
      >
        {n.type}
        {n.links > 0 ? ` · ${n.links}` : ''}
      </text>
    </g>
  );
}

/**
 * Editorial node — sparse dot + tier-sized Fraunces label by link count.
 * Tier 0 (>=4 links): 22px display, label to the right.
 * Tier 1 (>=2 links): 14px sans, below.
 * Tier 2 (1 link): 11px tertiary, below — hidden by default unless hovered/focal.
 */
export function EditorialNode({
  n,
  saturation = 'full',
  hovered = false,
  focal = false,
  dimmed = false,
  onHover,
  onClick,
  labelPolicy = 'hover',
  viewK = 1,
}) {
  const links = n.links || 0;
  const r = n.starred ? 5 : links >= 4 ? 4 : 2.5;
  const color = applyTypeSat(n.type, saturation);
  const opacity = dimmed ? 0.4 : 1;
  const tier = links >= 4 ? 0 : links >= 2 ? 1 : 2;
  const fontSize = [22, 14, 11][tier];
  const fontWeight = [400, 500, 400][tier];
  const showLabel =
    labelPolicy === 'always' ||
    (labelPolicy === 'hover' && (hovered || focal || tier === 0)) ||
    (labelPolicy === 'zoom' && viewK > 0.7) ||
    tier === 0 ||
    focal;

  return (
    <g
      data-node-variant="editorial"
      data-node-id={n.id}
      data-node-tier={tier}
      transform={`translate(${n.x}, ${n.y})`}
      opacity={opacity}
      onMouseEnter={() => onHover && onHover(n.id)}
      onMouseLeave={() => onHover && onHover(null)}
      onClick={() => onClick && onClick(n)}
      style={{ cursor: 'pointer' }}
    >
      {n.starred && (
        <circle
          r={r + 5}
          fill="none"
          stroke="var(--ac)"
          strokeWidth={0.5}
          opacity={0.6}
        />
      )}
      {n.ghost ? (
        <circle
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={0.75}
          strokeDasharray="1.5 2"
        />
      ) : (
        <circle r={r} fill={color} />
      )}
      {(hovered || focal) && (
        <circle r={r + 4} fill="none" stroke="var(--ac)" strokeWidth={0.5} />
      )}
      {showLabel && n.title && (
        <text
          data-node-label
          x={tier === 0 ? r + 10 : 0}
          y={tier === 0 ? 6 : r + fontSize + 2}
          textAnchor={tier === 0 ? 'start' : 'middle'}
          fontFamily="var(--jf-font-display)"
          fontSize={fontSize}
          fontWeight={fontWeight}
          fontStyle={n.ghost ? 'italic' : 'normal'}
          fill={n.ghost ? 'var(--t3)' : tier === 0 ? 'var(--tx)' : 'var(--t2)'}
          letterSpacing={tier === 0 ? '-0.005em' : 0}
          style={{
            paintOrder: 'stroke',
            stroke: 'var(--bg)',
            strokeWidth: 3,
            strokeLinejoin: 'round',
          }}
        >
          {n.title}
        </text>
      )}
    </g>
  );
}

export const NODE_VARIANTS = ['star', 'board', 'editorial'];
