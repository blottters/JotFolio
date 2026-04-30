import { describe, it, expect } from 'vitest';
import { parseRules } from './parseRules.js';

describe('parseRules', () => {
  it('parses a valid YAML doc with 3 rules into the rules array shape', () => {
    const yaml = [
      'ai:',
      '  triggers: [GPT, Claude, LLM]',
      '  links: [AI Index]',
      '',
      'frontend:',
      '  triggers: [React, JSX]',
      '  links: [Frontend Stack]',
      '',
      'stoic:',
      '  triggers: [Marcus Aurelius, Seneca]',
      '  links: [Stoicism]',
      '',
    ].join('\n');

    const result = parseRules(yaml);
    expect(result.error).toBeUndefined();
    expect(result.rules).toHaveLength(3);
    expect(result.rules[0]).toEqual({
      tag: 'ai',
      triggers: ['GPT', 'Claude', 'LLM'],
      links: ['AI Index'],
    });
    expect(result.rules[1]).toEqual({
      tag: 'frontend',
      triggers: ['React', 'JSX'],
      links: ['Frontend Stack'],
    });
    expect(result.rules[2]).toEqual({
      tag: 'stoic',
      triggers: ['Marcus Aurelius', 'Seneca'],
      links: ['Stoicism'],
    });
  });

  it('returns an empty rules array for an empty YAML string', () => {
    const result = parseRules('');
    expect(result).toEqual({ rules: [] });
  });

  it('defaults links to [] when the field is missing', () => {
    const yaml = [
      'ai:',
      '  triggers: [GPT, Claude]',
      '',
    ].join('\n');

    const result = parseRules(yaml);
    expect(result.error).toBeUndefined();
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0]).toEqual({
      tag: 'ai',
      triggers: ['GPT', 'Claude'],
      links: [],
    });
  });

  it('drops a rule that is missing the triggers field, without throwing', () => {
    const yaml = [
      'ai:',
      '  triggers: [GPT]',
      '  links: [AI Index]',
      '',
      'broken:',
      '  links: [Nowhere]',
      '',
      'frontend:',
      '  triggers: [React]',
      '',
    ].join('\n');

    const result = parseRules(yaml);
    expect(result.error).toBeUndefined();
    expect(result.rules.map((r) => r.tag)).toEqual(['ai', 'frontend']);
  });

  it('returns { error } for invalid YAML syntax instead of throwing', () => {
    const yaml = 'ai:\n  triggers: [GPT, Claude\n  links: [AI Index]\n';
    let result;
    expect(() => {
      result = parseRules(yaml);
    }).not.toThrow();
    expect(result.error).toBeTypeOf('string');
    expect(result.error.length).toBeGreaterThan(0);
  });

  it('keeps tag names with spaces and special chars verbatim, no normalization', () => {
    const yaml = [
      '"My Tag/With Stuff":',
      '  triggers: [foo]',
      '  links: [bar]',
      '',
      '"UPPER case":',
      '  triggers: [baz]',
      '',
    ].join('\n');

    const result = parseRules(yaml);
    expect(result.error).toBeUndefined();
    const tags = result.rules.map((r) => r.tag);
    expect(tags).toContain('My Tag/With Stuff');
    expect(tags).toContain('UPPER case');
  });

  it('coerces a string triggers value into a single-element array', () => {
    const yaml = [
      'ai:',
      '  triggers: GPT',
      '  links: [AI Index]',
      '',
    ].join('\n');

    const result = parseRules(yaml);
    expect(result.error).toBeUndefined();
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].triggers).toEqual(['GPT']);
  });

  it('lets the last duplicate tag win without erroring', () => {
    const yaml = [
      'ai:',
      '  triggers: [GPT]',
      '  links: [Old]',
      '',
      'ai:',
      '  triggers: [Claude, LLM]',
      '  links: [New]',
      '',
    ].join('\n');

    const result = parseRules(yaml);
    expect(result.error).toBeUndefined();
    const aiRules = result.rules.filter((r) => r.tag === 'ai');
    expect(aiRules).toHaveLength(1);
    expect(aiRules[0]).toEqual({
      tag: 'ai',
      triggers: ['Claude', 'LLM'],
      links: ['New'],
    });
  });
});
