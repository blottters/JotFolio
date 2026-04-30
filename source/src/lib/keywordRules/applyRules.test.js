import { describe, it, expect } from 'vitest';
import { applyRules } from './applyRules.js';

const aiRule = { tag: 'ai', triggers: ['GPT', 'Claude', 'LLM'], links: ['AI Index'] };
const frontendRule = { tag: 'frontend', triggers: ['React', 'JSX'], links: ['Frontend Stack'] };
const specialRule = { tag: 'langs', triggers: ['C++', '.NET', 'node.js'], links: [] };

describe('applyRules', () => {
  it('matches "GPT-4" against trigger "GPT" (hyphen counts as word boundary)', () => {
    const entry = { title: '', notes: 'I tried GPT-4 yesterday', url: '' };
    const result = applyRules(entry, [aiRule], []);
    expect(result.tags).toContain('ai');
    expect(result.firedRules).toContain('ai');
    expect(result.matchedTriggers.ai).toContain('GPT');
  });

  it('does NOT match "GPTRulez" against trigger "GPT" (no word boundary)', () => {
    const entry = { title: '', notes: 'GPTRulez is my band name', url: '' };
    const result = applyRules(entry, [aiRule], []);
    expect(result.tags).not.toContain('ai');
    expect(result.firedRules).not.toContain('ai');
  });

  it('matches case-insensitively ("gpt" matches trigger "GPT")', () => {
    const entry = { title: '', notes: 'lowercase gpt mention', url: '' };
    const result = applyRules(entry, [aiRule], []);
    expect(result.tags).toContain('ai');
  });

  it('matches against title only when body is empty', () => {
    const entry = { title: 'About GPT', notes: '', url: '' };
    const result = applyRules(entry, [aiRule], []);
    expect(result.tags).toContain('ai');
  });

  it('matches against URL field', () => {
    const youtubeRule = { tag: 'video', triggers: ['youtube'], links: ['Video Index'] };
    const entry = { title: 'Cool clip', notes: '', url: 'https://youtube.com/watch?v=abc' };
    const result = applyRules(entry, [youtubeRule], []);
    expect(result.tags).toContain('video');
    expect(result.links).toContain('Video Index');
  });

  it('collects tags + links when multiple rules fire on the same entry', () => {
    const entry = {
      title: 'React + GPT experiments',
      notes: 'using JSX with Claude API',
      url: '',
    };
    const result = applyRules(entry, [aiRule, frontendRule], []);
    expect(result.tags).toEqual(expect.arrayContaining(['ai', 'frontend']));
    expect(result.links).toEqual(expect.arrayContaining(['AI Index', 'Frontend Stack']));
    expect(result.firedRules).toEqual(['ai', 'frontend']);
  });

  it('excludes opted-out tag from output but rule still fires (links unaffected)', () => {
    const entry = { title: '', notes: 'Claude is great', url: '' };
    const result = applyRules(entry, [aiRule], ['ai']);
    expect(result.firedRules).toContain('ai');
    expect(result.tags).not.toContain('ai');
    // Opting out of the tag "ai" must NOT suppress the rule's links.
    expect(result.links).toContain('AI Index');
  });

  it('excludes opted-out link from output but other links/tags persist', () => {
    const entry = { title: '', notes: 'Claude is great', url: '' };
    const result = applyRules(entry, [aiRule], ['AI Index']);
    expect(result.firedRules).toContain('ai');
    expect(result.tags).toContain('ai');
    expect(result.links).not.toContain('AI Index');
  });

  it('returns empty output for empty rules array, no crash', () => {
    const entry = { title: 'anything', notes: 'whatever', url: '' };
    const result = applyRules(entry, [], []);
    expect(result).toEqual({
      tags: [],
      links: [],
      firedRules: [],
      matchedTriggers: {},
    });
  });

  it('handles entry with undefined notes/url fields gracefully', () => {
    const entry = { title: 'GPT note' };
    const result = applyRules(entry, [aiRule], []);
    expect(result.tags).toContain('ai');
  });

  it('handles entry with all undefined text fields without crashing', () => {
    const entry = {};
    const result = applyRules(entry, [aiRule], []);
    expect(result.tags).toEqual([]);
    expect(result.firedRules).toEqual([]);
  });

  it('escapes special regex chars in triggers ("C++", ".NET", "node.js") for literal match', () => {
    const entry = { title: '', notes: 'I write C++ and .NET and node.js', url: '' };
    const result = applyRules(entry, [specialRule], []);
    expect(result.tags).toContain('langs');
    expect(result.matchedTriggers.langs).toEqual(
      expect.arrayContaining(['C++', '.NET', 'node.js'])
    );
  });

  it('special chars escaped: "CXX" should not match trigger "C++"', () => {
    const entry = { title: '', notes: 'CXX is not the same', url: '' };
    const result = applyRules(entry, [specialRule], []);
    // ".NET" / "node.js" not present either
    expect(result.tags).not.toContain('langs');
  });

  it('preserves rule.tag case (does not lowercase)', () => {
    const camelRule = { tag: 'AIStuff', triggers: ['GPT'], links: ['AI-Index'] };
    const entry = { title: '', notes: 'GPT note', url: '' };
    const result = applyRules(entry, [camelRule], []);
    expect(result.tags).toContain('AIStuff');
    expect(result.links).toContain('AI-Index');
  });

  it('preserves rule-firing order (no alphabetic sort)', () => {
    // zebra fires before alpha
    const zebraRule = { tag: 'zebra', triggers: ['stripes'], links: [] };
    const alphaRule = { tag: 'alpha', triggers: ['letters'], links: [] };
    const entry = { title: '', notes: 'stripes and letters', url: '' };
    const result = applyRules(entry, [zebraRule, alphaRule], []);
    expect(result.firedRules).toEqual(['zebra', 'alpha']);
    expect(result.tags).toEqual(['zebra', 'alpha']);
  });

  it('dedupes tags + links across rules that produce the same value', () => {
    const r1 = { tag: 'ai', triggers: ['GPT'], links: ['Shared Index'] };
    const r2 = { tag: 'ai', triggers: ['Claude'], links: ['Shared Index'] };
    const entry = { title: '', notes: 'GPT and Claude', url: '' };
    const result = applyRules(entry, [r1, r2], []);
    expect(result.tags.filter((t) => t === 'ai').length).toBe(1);
    expect(result.links.filter((l) => l === 'Shared Index').length).toBe(1);
  });

  it('PURITY: does not mutate inputs', () => {
    const entry = { title: 'GPT-4 test', notes: 'React + JSX', url: 'https://youtube.com' };
    const rules = [
      { tag: 'ai', triggers: ['GPT'], links: ['AI Index'] },
      { tag: 'frontend', triggers: ['React', 'JSX'], links: ['Frontend Stack'] },
    ];
    const optOuts = ['frontend'];

    const entryBefore = JSON.stringify(entry);
    const rulesBefore = JSON.stringify(rules);
    const optOutsBefore = JSON.stringify(optOuts);

    applyRules(entry, rules, optOuts);

    expect(JSON.stringify(entry)).toBe(entryBefore);
    expect(JSON.stringify(rules)).toBe(rulesBefore);
    expect(JSON.stringify(optOuts)).toBe(optOutsBefore);
  });

  // Unicode / non-ASCII boundary correctness — fixes Pen-Tester Pete bug #1.
  // Original implementation used JS \b which is ASCII-only, letting "日本"
  // silently substring-match "日本語". Charter D3 violation. Fix: Unicode-aware
  // boundaries via lookbehind/lookahead on \p{L}\p{N}_.

  it('does NOT match CJK trigger "日本" against substring in "日本語"', () => {
    const cjkRule = { tag: 'jp', triggers: ['日本'], links: [] };
    const entry = { title: '', notes: '今日は日本語を勉強した', url: '' };
    const result = applyRules(entry, [cjkRule], []);
    expect(result.tags).not.toContain('jp');
    expect(result.firedRules).not.toContain('jp');
  });

  it('DOES match CJK trigger "日本" when surrounded by non-letters', () => {
    const cjkRule = { tag: 'jp', triggers: ['日本'], links: [] };
    const entry = { title: '', notes: 'I went to 日本 last summer.', url: '' };
    const result = applyRules(entry, [cjkRule], []);
    expect(result.tags).toContain('jp');
  });

  it('does NOT match accented Latin trigger "café" against "cafés"', () => {
    const latinRule = { tag: 'food', triggers: ['café'], links: [] };
    const entry = { title: '', notes: 'visited many cafés in Paris', url: '' };
    const result = applyRules(entry, [latinRule], []);
    expect(result.tags).not.toContain('food');
  });

  it('DOES match accented trigger "café" when properly bounded', () => {
    const latinRule = { tag: 'food', triggers: ['café'], links: [] };
    const entry = { title: '', notes: 'sat at a café for hours', url: '' };
    const result = applyRules(entry, [latinRule], []);
    expect(result.tags).toContain('food');
  });

  it('does NOT match Cyrillic trigger "Москва" against "Москвой"', () => {
    const cyrRule = { tag: 'ru', triggers: ['Москва'], links: [] };
    const entry = { title: '', notes: 'Под Москвой холодно', url: '' };
    const result = applyRules(entry, [cyrRule], []);
    expect(result.tags).not.toContain('ru');
  });
});
