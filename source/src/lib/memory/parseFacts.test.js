import { describe, it, expect } from 'vitest';
import { parseFacts } from './parseFacts.js';

describe('parseFacts', () => {
  it('extracts 3 bullets from a ## Summary section', () => {
    const body = [
      '# Title',
      '',
      '## Summary',
      '- alpha',
      '- bravo',
      '- charlie',
      '',
      '## Other',
      '- ignored',
    ].join('\n');
    expect(parseFacts(body)).toEqual(['alpha', 'bravo', 'charlie']);
  });

  it('returns [] when no Summary heading present', () => {
    const body = '# Title\n\n## Notes\n- not a summary\n';
    expect(parseFacts(body)).toEqual([]);
  });

  it('returns [] when Summary section is empty', () => {
    const body = '## Summary\n\n## Next\n- nope\n';
    expect(parseFacts(body)).toEqual([]);
  });

  it('returns [] when Summary contains paragraph text only', () => {
    const body = '## Summary\n\nThis is just prose with no bullets at all.\n\n## Next\n';
    expect(parseFacts(body)).toEqual([]);
  });

  it('extracts bullets using `*` marker', () => {
    const body = '## Summary\n* one\n* two\n';
    expect(parseFacts(body)).toEqual(['one', 'two']);
  });

  it('handles CRLF the same as LF', () => {
    const lf = '## Summary\n- a\n- b\n';
    const crlf = '## Summary\r\n- a\r\n- b\r\n';
    expect(parseFacts(crlf)).toEqual(parseFacts(lf));
    expect(parseFacts(crlf)).toEqual(['a', 'b']);
  });

  it('recognizes single-hash `# Summary`', () => {
    const body = '# Summary\n- only\n- two\n';
    expect(parseFacts(body)).toEqual(['only', 'two']);
  });

  it('stops at the next ## heading and does not include later bullets', () => {
    const body = [
      '## Summary',
      '- in',
      '## Details',
      '- out',
      '- also out',
    ].join('\n');
    expect(parseFacts(body)).toEqual(['in']);
  });

  it('includes nested 4-space-indented bullets, stripping indent + dash', () => {
    const body = [
      '## Summary',
      '- top',
      '    - nested',
      '- another top',
    ].join('\n');
    expect(parseFacts(body)).toEqual(['top', 'nested', 'another top']);
  });

  it('ignores multiple consecutive blank lines inside the Summary section', () => {
    const body = [
      '## Summary',
      '',
      '',
      '- first',
      '',
      '',
      '',
      '- second',
      '',
    ].join('\n');
    expect(parseFacts(body)).toEqual(['first', 'second']);
  });

  it('is case-insensitive on the heading text', () => {
    expect(parseFacts('## summary\n- x\n')).toEqual(['x']);
    expect(parseFacts('## SUMMARY\n- y\n')).toEqual(['y']);
  });

  it('returns [] for non-string / empty input', () => {
    expect(parseFacts('')).toEqual([]);
    expect(parseFacts(null)).toEqual([]);
    expect(parseFacts(undefined)).toEqual([]);
  });
});
