export const RELATIONSHIP_DECISIONS_STORAGE_KEY = 'jf-relationship-decisions';
export const RELATIONSHIP_DECISION_STATUSES = new Set(['accepted', 'rejected', 'ignored']);

function clean(value) {
  return String(value || '').trim();
}

function normalizeKeyPart(value) {
  return clean(value).toLowerCase().replace(/\s+/g, ' ');
}

export function relationshipDecisionKey(issue = {}) {
  const kind = clean(issue.kind);
  if (kind === 'isolated') return `graph-health:isolated:${clean(issue.entryId)}`;
  if (kind === 'unresolved') return `graph-health:unresolved:${normalizeKeyPart(issue.target)}`;
  if (kind === 'missing-project') return `graph-health:missing-project:${clean(issue.entryId)}:${normalizeKeyPart(issue.project)}`;
  if (kind === 'no-tags') return `graph-health:no-tags:${clean(issue.entryId)}`;
  return `graph-health:${kind || 'issue'}:${normalizeKeyPart(issue.id || issue.label || issue.target || issue.entryId)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function setRelationshipDecision(decisions = {}, issue = {}, status, { now = nowIso() } = {}) {
  if (!RELATIONSHIP_DECISION_STATUSES.has(status)) throw new Error(`Invalid relationship decision status: ${status}`);
  const key = relationshipDecisionKey(issue);
  return {
    ...decisions,
    [key]: {
      id: key,
      status,
      kind: clean(issue.kind),
      entryId: clean(issue.entryId),
      target: clean(issue.target),
      project: clean(issue.project),
      label: clean(issue.label || issue.title || issue.target || issue.entryId),
      origin: clean(issue.origin || 'graph-health'),
      updatedAt: now,
    },
  };
}

export function clearRelationshipDecision(decisions = {}, issue = {}) {
  const key = relationshipDecisionKey(issue);
  const next = { ...decisions };
  delete next[key];
  return next;
}

export function relationshipDecisionStatus(decisions = {}, issue = {}) {
  return decisions?.[relationshipDecisionKey(issue)]?.status || '';
}

export function parseRelationshipDecisions(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const source = parsed?.decisions && typeof parsed.decisions === 'object' ? parsed.decisions : parsed;
    if (!source || typeof source !== 'object') return {};
    return Object.fromEntries(Object.entries(source).filter(([, value]) => RELATIONSHIP_DECISION_STATUSES.has(value?.status)));
  } catch {
    return {};
  }
}

export function serializeRelationshipDecisions(decisions = {}) {
  return JSON.stringify({ version: 1, decisions });
}

export function loadRelationshipDecisions(storage = globalThis.localStorage) {
  try {
    return parseRelationshipDecisions(storage?.getItem(RELATIONSHIP_DECISIONS_STORAGE_KEY));
  } catch {
    return {};
  }
}

export function saveRelationshipDecisions(decisions = {}, storage = globalThis.localStorage) {
  try {
    storage?.setItem(RELATIONSHIP_DECISIONS_STORAGE_KEY, serializeRelationshipDecisions(decisions));
  } catch {
    // Non-critical. The graph still works; decisions just won't persist.
  }
}
