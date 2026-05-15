import React from 'react';
import { getNodeVisualState } from './constellationVisuals.js';

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

function visualNode(n) {
  if (Array.isArray(n.links)) return n;
  return {
    ...n,
    links: Array.from({ length: Math.max(0, n.links || 0) }, (_, i) => String(i)),
  };
}

/**
 * Map node — compact point with an optional focus ring.
 * Labels appear on hover, keyboard focus, focal, or starred.
 *
 * @param {object} props.n - node data { id, x, y, type, links, title, starred, ghost }
 * @param {string} props.saturation - 'signal' | 'bone' | 'sepia' | 'cool' | 'mono'
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
  saturation = 'signal',
  hovered = false,
  focused = false,
  focal = false,
  dimmed = false,
  onHover,
  onClick,
  labelPolicy = 'hover',
  viewK = 1,
}) {
  const active = hovered || focused || focal;
  const visual = getNodeVisualState(visualNode(n), { theme: saturation, active, focused, focal, dimmed });
  const r = visual.radius || SIZE_FOR_LINKS(n.links);
  const opacity = visual.opacity;
  const fill = visual.isHollow ? 'transparent' : visual.fill;
  const showLabel =
    labelPolicy === 'always' ||
    (labelPolicy === 'hover' && active) ||
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
      {focused && (
        <circle
          data-node-focus-ring
          r={r + 7}
          fill="none"
          stroke="var(--ac)"
          strokeWidth={1.5}
          opacity={0.95}
        />
      )}
      {n.starred && (
        <circle
          r={r + 6}
          fill="none"
          stroke="#FFE08A"
          strokeWidth={1.2}
          opacity={0.72}
        />
      )}
      {n.ghost ? (
        <circle
          r={r}
          fill="none"
          stroke={visual.stroke}
          strokeWidth={visual.strokeWidth}
          strokeDasharray={visual.strokeDasharray || '2 3'}
          opacity={0.7}
        />
      ) : (
        <circle r={r} fill={fill} stroke={visual.stroke} strokeWidth={visual.strokeWidth} strokeDasharray={visual.strokeDasharray} />
      )}
      {active && !n.ghost && (
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
          fill={n.ghost ? 'var(--t3)' : visual.labelFill}
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
 * Board node — compact index card with title + meta line.
 * Type-color strip on the left edge. Hub nodes (>=4 links) get bolder title.
 * Card inherits the app surface colors so it stays aligned with the shell.
 */
export function BoardNode({
  n,
  saturation = 'signal',
  hovered = false,
  focused = false,
  focal = false,
  dimmed = false,
  onHover,
  onClick,
}) {
  const w = 144;
  const h = 44;
  const isHub = (n.links || 0) >= 4;
  const active = hovered || focused || focal;
  const visual = getNodeVisualState(visualNode(n), { theme: saturation, active, focused, focal, dimmed });
  const opacity = visual.opacity;
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
        fill={n.ghost ? 'transparent' : 'var(--cd)'}
        stroke={visual.stroke}
        strokeWidth={visual.strokeWidth}
        strokeDasharray={visual.strokeDasharray || (n.ghost ? '3 3' : null)}
      />
      {!n.ghost && (
        <rect
          data-node-strip
          x={0}
          y={0}
          width={3}
          height={h}
          fill={visual.fill}
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
          stroke="#FFE08A"
          strokeWidth={0.9}
          opacity={0.82}
        />
      )}
      {active && (
        <rect
          data-node-focus-ring
          x={-1}
          y={-1}
          width={w + 2}
          height={h + 2}
          fill="none"
          stroke={focused ? 'var(--ac)' : 'var(--tx)'}
          strokeWidth={focused ? 1.5 : 1}
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
        fill={n.ghost ? 'var(--t3)' : 'var(--tx)'}
      >
        {displayTitle}
      </text>
      <text
        data-node-meta
        x={10}
        y={34}
        fontFamily="var(--jf-font-sans)"
        fontSize={10}
        fill={n.ghost ? 'var(--t3)' : 'var(--t2)'}
        letterSpacing="0.06em"
      >
        {n.type}
        {n.links > 0 ? ` · ${n.links}` : ''}
      </text>
    </g>
  );
}

/**
 * Editorial node — sparse dot + tier-sized label by link count.
 * Tier 0 (>=4 links): 22px display, label to the right.
 * Tier 1 (>=2 links): 14px sans, below.
 * Tier 2 (1 link): 11px tertiary, below — hidden by default unless hovered/focal.
 */
export function EditorialNode({
  n,
  saturation = 'signal',
  hovered = false,
  focused = false,
  focal = false,
  dimmed = false,
  onHover,
  onClick,
  labelPolicy = 'hover',
  viewK = 1,
}) {
  const links = n.links || 0;
  const r = n.starred ? 5 : links >= 4 ? 4 : 2.5;
  const tier = links >= 4 ? 0 : links >= 2 ? 1 : 2;
  const fontSize = [22, 14, 11][tier];
  const fontWeight = [400, 500, 400][tier];
  const active = hovered || focused || focal;
  const visual = getNodeVisualState(visualNode(n), { theme: saturation, active, focused, focal, dimmed });
  const opacity = visual.opacity;
  const showLabel =
    labelPolicy === 'always' ||
    (labelPolicy === 'hover' && (active || tier === 0)) ||
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
          stroke="#FFE08A"
          strokeWidth={0.7}
          opacity={0.72}
        />
      )}
      {n.ghost ? (
        <circle
          r={r}
          fill="none"
          stroke={visual.stroke}
          strokeWidth={1}
          strokeDasharray={visual.strokeDasharray || '1.5 2'}
        />
      ) : (
        <circle r={r} fill={visual.isHollow ? 'transparent' : visual.fill} stroke={visual.stroke} strokeWidth={Math.max(1, visual.strokeWidth - 0.6)} strokeDasharray={visual.strokeDasharray} />
      )}
      {focused && (
        <circle
          data-node-focus-ring
          r={r + 7}
          fill="none"
          stroke="var(--ac)"
          strokeWidth={1.4}
        />
      )}
      {active && (
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
          fill={n.ghost ? 'var(--t3)' : tier === 0 ? visual.labelFill : 'var(--t2)'}
          letterSpacing={0}
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
