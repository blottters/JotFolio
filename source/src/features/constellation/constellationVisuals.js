import { LABEL, applyTypeSat } from '../../lib/types.js';

export const CONSTELLATION_ROLE_LABELS = Object.freeze({
  missing: 'Missing link',
  capture: 'Inbox capture',
  memory: 'Memory',
  project: 'Project',
  task: 'Task',
  hub: 'Hub',
  entry: 'Entry',
});

export function graphDegree(node) {
  return Array.isArray(node?.links) ? node.links.length : 0;
}

export function getNodeRole(node) {
  if (node?._unresolved || node?.ghost) return 'missing';
  if (node?.type === 'raw') return 'capture';
  if (node?.type === 'wiki' || node?.type === 'review') return 'memory';
  if (node?.type === 'project') return 'project';
  if (node?.type === 'task') return 'task';
  if (graphDegree(node) >= 4) return 'hub';
  return 'entry';
}

export function nodeRoleLabel(node) {
  const role = getNodeRole(node);
  if (role !== 'entry') return CONSTELLATION_ROLE_LABELS[role];
  return LABEL[node?.type] || 'Entry';
}

export function getNodePalette(node, theme = 'signal') {
  const role = getNodeRole(node);
  if (role === 'missing') {
    return {
      fill: 'rgba(154,167,184,.10)',
      stroke: '#9AA7B8',
      label: 'var(--t2)',
      halo: 'rgba(154,167,184,.18)',
      dash: '5 5',
    };
  }
  if (role === 'capture') {
    return {
      fill: '#F6A873',
      stroke: '#FFD0A8',
      label: 'var(--tx)',
      halo: 'rgba(246,168,115,.22)',
      dash: '',
    };
  }
  if (node?.type === 'wiki') {
    return {
      fill: '#B8A8FF',
      stroke: '#E3DCFF',
      label: 'var(--tx)',
      halo: 'rgba(184,168,255,.24)',
      dash: '',
    };
  }
  if (node?.type === 'review') {
    return {
      fill: 'rgba(255,139,190,.12)',
      stroke: '#FF8BBE',
      label: 'var(--tx)',
      halo: 'rgba(255,139,190,.22)',
      dash: '',
    };
  }
  const color = applyTypeSat(node?.type, theme);
  return {
    fill: color,
    stroke: color,
    label: 'var(--tx)',
    halo: `color-mix(in srgb, ${color} 22%, transparent)`,
    dash: '',
  };
}

export function getNodeVisualState(node, options = {}) {
  const {
    theme = 'signal',
    active = false,
    focused = false,
    focal = false,
    dimmed = false,
  } = options;
  const palette = getNodePalette(node, theme);
  const role = getNodeRole(node);
  const degree = graphDegree(node);
  const emphasized = active || focused || focal;
  return {
    role,
    degree,
    radius: Math.max(6, Math.min(22, 7 + Math.sqrt(degree + 1) * 4)),
    fill: palette.fill,
    stroke: focused ? 'var(--ac)' : focal ? 'var(--tx)' : palette.stroke,
    strokeWidth: focused ? 2.8 : focal || emphasized ? 2.2 : role === 'memory' ? 2 : 1.4,
    strokeDasharray: palette.dash || undefined,
    halo: palette.halo,
    labelFill: palette.label,
    opacity: dimmed ? 0.58 : 1,
    isHollow: node?.type === 'review' || role === 'missing',
    isHub: degree >= 4,
  };
}

export function getEdgeVisualState(edge, options = {}) {
  const { active = false, focal = false, dimmed = false } = options;
  if (edge?.unresolved) {
    return {
      stroke: '#9AA7B8',
      strokeWidth: active || focal ? 1.8 : 1.1,
      opacity: dimmed ? 0.18 : active || focal ? 0.78 : 0.44,
      strokeDasharray: '5 5',
    };
  }
  return {
    stroke: active || focal ? 'var(--ac)' : 'color-mix(in srgb, var(--br) 78%, var(--tx) 22%)',
    strokeWidth: active || focal ? 1.8 : 0.9,
    opacity: dimmed ? 0.08 : active || focal ? 0.86 : 0.2,
    strokeDasharray: undefined,
  };
}

export function summarizeGraph({ nodes = [], edges = [] } = {}) {
  const memory = nodes.filter(node => node.type === 'wiki' || node.type === 'review').length;
  const missing = nodes.filter(node => node._unresolved || node.ghost).length;
  const captures = nodes.filter(node => node.type === 'raw').length;
  const hubs = nodes.filter(node => graphDegree(node) >= 4).length;
  return {
    nodes: nodes.length,
    edges: edges.length,
    memory,
    missing,
    captures,
    hubs,
  };
}
