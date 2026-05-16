import { MANUAL_LINKS_FIELD } from '../frontmatter.js';

export const RELATIONSHIP_REVIEW_STORAGE_KEY = 'jf-relationship-review-ledger';
export const RELATIONSHIP_REVIEW_STATUSES = new Set(['pending', 'applied', 'undone', 'rejected']);
export const RELATIONSHIP_REVIEW_KINDS = new Set(['related-note', 'wiki-link', 'tag', 'project']);

function clean(value) {
  return String(value || '').trim();
}

function normalizeKeyPart(value) {
  return clean(value).toLowerCase().replace(/\s+/g, ' ');
}

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function uniquePush(list, value) {
  const cleaned = clean(value);
  if (!cleaned) return Array.isArray(list) ? [...list] : [];
  const next = Array.isArray(list) ? [...list] : [];
  if (!next.map(String).includes(cleaned)) next.push(cleaned);
  return next;
}

export function relationshipReviewKey(review = {}) {
  const kind = clean(review.kind);
  const source = clean(review.sourceEntryId);
  if (kind === 'related-note') return `relationship-review:related-note:${source}:${clean(review.targetEntryId)}`;
  if (kind === 'wiki-link') return `relationship-review:wiki-link:${source}:${normalizeKeyPart(review.targetTitle)}`;
  if (kind === 'tag') return `relationship-review:tag:${source}:${normalizeKeyPart(review.tag)}`;
  if (kind === 'project') return `relationship-review:project:${source}:${normalizeKeyPart(review.project)}`;
  return `relationship-review:${kind || 'relationship'}:${source}:${normalizeKeyPart(review.targetEntryId || review.targetTitle || review.tag || review.project)}`;
}

function operationsForReview(review = {}) {
  const kind = clean(review.kind);
  const sourceEntryId = clean(review.sourceEntryId);
  if (!sourceEntryId) throw new Error('Relationship review requires sourceEntryId');

  if (kind === 'related-note') {
    const targetEntryId = clean(review.targetEntryId);
    if (!targetEntryId) throw new Error('related-note review requires targetEntryId');
    return [
      { type: 'add-link', entryId: sourceEntryId, targetEntryId },
      { type: 'add-link', entryId: targetEntryId, targetEntryId: sourceEntryId },
    ];
  }
  if (kind === 'wiki-link') {
    const targetTitle = clean(review.targetTitle);
    if (!targetTitle) throw new Error('wiki-link review requires targetTitle');
    return [{ type: 'append-wikilink', entryId: sourceEntryId, targetTitle }];
  }
  if (kind === 'tag') {
    const tag = clean(review.tag);
    if (!tag) throw new Error('tag review requires tag');
    return [{ type: 'add-tag', entryId: sourceEntryId, tag }];
  }
  if (kind === 'project') {
    const project = clean(review.project);
    if (!project) throw new Error('project review requires project');
    return [{ type: 'set-project', entryId: sourceEntryId, project }];
  }
  throw new Error(`Unsupported relationship review kind: ${kind}`);
}

export function createRelationshipReview(input = {}) {
  const kind = clean(input.kind);
  if (!RELATIONSHIP_REVIEW_KINDS.has(kind)) throw new Error(`Unsupported relationship review kind: ${kind}`);
  const timestamp = input.now || nowIso();
  const review = {
    id: '',
    kind,
    status: 'pending',
    sourceEntryId: clean(input.sourceEntryId),
    targetEntryId: clean(input.targetEntryId),
    targetTitle: clean(input.targetTitle),
    tag: clean(input.tag),
    project: clean(input.project),
    origin: clean(input.origin || 'graph-health'),
    reason: clean(input.reason),
    confidence: typeof input.confidence === 'number' ? input.confidence : undefined,
    operations: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  review.operations = operationsForReview(review);
  review.id = relationshipReviewKey(review);
  return Object.fromEntries(Object.entries(review).filter(([, value]) => value !== undefined && value !== ''));
}

function applyOperation(entry, operation) {
  if (operation.type === 'add-tag') {
    return { ...entry, tags: uniquePush(entry.tags, operation.tag) };
  }
  if (operation.type === 'add-link') {
    return {
      ...entry,
      links: uniquePush(entry.links, operation.targetEntryId),
      [MANUAL_LINKS_FIELD]: true,
    };
  }
  if (operation.type === 'set-project') {
    return { ...entry, project: clean(operation.project) };
  }
  if (operation.type === 'append-wikilink') {
    const targetTitle = clean(operation.targetTitle);
    const notes = String(entry.notes || '');
    if (notes.toLowerCase().includes(`[[${targetTitle.toLowerCase()}]]`)) return entry;
    const prefix = notes.trim() ? `${notes.replace(/\s+$/g, '')}\n\n` : '';
    return { ...entry, notes: `${prefix}Related: [[${targetTitle}]]\n` };
  }
  throw new Error(`Unsupported relationship operation: ${operation.type}`);
}

export function applyRelationshipReview(entries = [], review = {}, { now = nowIso() } = {}) {
  if (review.status && review.status !== 'pending') throw new Error(`Cannot apply ${review.status} relationship review`);
  const entryMap = new Map(entries.map(entry => [entry.id, clone(entry)]));
  const snapshots = [];

  for (const operation of review.operations || operationsForReview(review)) {
    const current = entryMap.get(operation.entryId);
    if (!current) throw new Error(`Missing entry for relationship operation: ${operation.entryId}`);
    const before = clone(current);
    const after = applyOperation(current, operation);
    entryMap.set(operation.entryId, clone(after));
    snapshots.push({ entryId: operation.entryId, before, after: clone(after) });
  }

  const nextEntries = entries.map(entry => entryMap.get(entry.id) || clone(entry));
  const undoRecord = {
    id: `relationship-undo:${review.id || relationshipReviewKey(review)}:${now}`,
    reviewId: review.id || relationshipReviewKey(review),
    createdAt: now,
    snapshots,
  };
  const appliedReview = {
    ...review,
    status: 'applied',
    appliedAt: now,
    updatedAt: now,
    undoRecord,
  };
  return {
    entries: nextEntries,
    review: appliedReview,
    undoRecord,
  };
}

export function undoRelationshipReview(entries = [], review = {}, undoRecord = {}, { now = nowIso() } = {}) {
  if (review.status !== 'applied') throw new Error(`Cannot undo ${review.status || 'pending'} relationship review`);
  const record = undoRecord?.snapshots ? undoRecord : review.undoRecord || {};
  const restoreById = new Map((record.snapshots || []).map(snapshot => [snapshot.entryId, clone(snapshot.before)]));
  const nextEntries = entries.map(entry => restoreById.get(entry.id) || clone(entry));
  return {
    entries: nextEntries,
    review: {
      ...review,
      status: 'undone',
      undoneAt: now,
      updatedAt: now,
    },
  };
}

export function rejectRelationshipReview(review = {}, { now = nowIso() } = {}) {
  if (review.status && review.status !== 'pending') throw new Error(`Cannot reject ${review.status} relationship review`);
  return {
    ...review,
    status: 'rejected',
    rejectedAt: now,
    updatedAt: now,
  };
}

function validReview(value) {
  return value && RELATIONSHIP_REVIEW_STATUSES.has(value.status) && Array.isArray(value.operations);
}

export function parseRelationshipReviewLedger(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const source = parsed?.reviews && typeof parsed.reviews === 'object' ? parsed.reviews : parsed;
    if (!source || typeof source !== 'object') return {};
    return Object.fromEntries(Object.entries(source).filter(([, value]) => validReview(value)));
  } catch {
    return {};
  }
}

export function serializeRelationshipReviewLedger(reviews = {}) {
  return JSON.stringify({ version: 1, reviews });
}

export function loadRelationshipReviewLedger(storage = globalThis.localStorage) {
  try {
    return parseRelationshipReviewLedger(storage?.getItem(RELATIONSHIP_REVIEW_STORAGE_KEY));
  } catch {
    return {};
  }
}

export function saveRelationshipReviewLedger(reviews = {}, storage = globalThis.localStorage) {
  try {
    storage?.setItem(RELATIONSHIP_REVIEW_STORAGE_KEY, serializeRelationshipReviewLedger(reviews));
  } catch {
    // Non-critical. The review engine is pure; callers can still apply in memory.
  }
}
