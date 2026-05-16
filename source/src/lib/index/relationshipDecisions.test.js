import { describe, expect, it } from 'vitest';
import {
  clearRelationshipDecision,
  parseRelationshipDecisions,
  relationshipDecisionKey,
  relationshipDecisionStatus,
  setRelationshipDecision,
  serializeRelationshipDecisions,
} from './relationshipDecisions.js';

describe('relationshipDecisions', () => {
  it('creates stable keys for graph health issues', () => {
    expect(relationshipDecisionKey({ kind: 'isolated', entryId: 'note-1' })).toBe('graph-health:isolated:note-1');
    expect(relationshipDecisionKey({ kind: 'unresolved', target: 'Missing Idea' })).toBe('graph-health:unresolved:missing idea');
    expect(relationshipDecisionKey({ kind: 'missing-project', entryId: 'note-1', project: 'Roadmap' })).toBe('graph-health:missing-project:note-1:roadmap');
  });

  it('sets, replaces, and clears review decisions without mutating the previous map', () => {
    const issue = { kind: 'unresolved', target: 'Missing Idea', label: 'Missing Idea' };
    const first = setRelationshipDecision({}, issue, 'accepted', { now: '2026-05-15T12:00:00.000Z' });
    const second = setRelationshipDecision(first, issue, 'ignored', { now: '2026-05-15T12:05:00.000Z' });

    expect(relationshipDecisionStatus(first, issue)).toBe('accepted');
    expect(relationshipDecisionStatus(second, issue)).toBe('ignored');
    expect(second[relationshipDecisionKey(issue)]).toEqual(expect.objectContaining({
      status: 'ignored',
      label: 'Missing Idea',
      updatedAt: '2026-05-15T12:05:00.000Z',
    }));

    expect(relationshipDecisionStatus(clearRelationshipDecision(second, issue), issue)).toBe('');
  });

  it('round-trips stored decisions and rejects unknown statuses', () => {
    const decisions = setRelationshipDecision({}, { kind: 'isolated', entryId: 'a', label: 'Alpha' }, 'rejected', {
      now: '2026-05-15T12:00:00.000Z',
    });
    const serialized = serializeRelationshipDecisions(decisions);
    const parsed = parseRelationshipDecisions(serialized);

    expect(parsed).toEqual(decisions);
    expect(() => setRelationshipDecision({}, { kind: 'isolated', entryId: 'a' }, 'maybe')).toThrow(/Invalid relationship decision status/);
    expect(parseRelationshipDecisions('{broken')).toEqual({});
  });
});
