/**
 * parseFacts — extract bullet facts from the `## Summary` section of a markdown body.
 *
 * Pure, synchronous, zero-dependency. Used in Phase 5 of the Karpathy memory
 * pipeline to lift the compiled memory's bulleted summary into discrete fact
 * strings for downstream graph node creation.
 *
 * Behavior:
 *  - Finds the FIRST `## Summary` heading (case-insensitive). Lenient on heading
 *    depth: `# Summary`, `## Summary`, `### Summary` all count.
 *  - Reads lines until the next ATX heading of equal-or-shallower depth, or EOF.
 *    For simplicity / robustness across compiler outputs we stop at any line
 *    matching `^#{1,6}\s+` after the Summary heading.
 *  - Inside that section, every line whose trimmed form starts with `- ` or
 *    `* ` is treated as a fact. Bullet marker + leading whitespace stripped,
 *    trailing whitespace trimmed.
 *  - Nested bullets (e.g. 4-space-indented `- foo`) ARE included; their indent
 *    + bullet marker is stripped just like top-level bullets. The fact text
 *    itself is what matters; structural nesting is discarded by design.
 *  - Blank lines inside the section are ignored.
 *  - Non-bullet lines (paragraph text) inside the section are ignored.
 *  - Returns `[]` if no Summary heading exists, or the section yields no
 *    bullets. Caller decides whether to fall back to raw text — out of scope.
 *  - Handles both LF and CRLF line endings.
 *
 * @param {string} body  Markdown body string (e.g. compiled memory `notes`).
 * @returns {string[]}   Array of fact strings, in document order.
 */
export function parseFacts(body) {
  if (typeof body !== 'string' || body.length === 0) return [];

  // Normalize line endings so CRLF and LF behave identically.
  const lines = body.replace(/\r\n/g, '\n').split('\n');

  // Locate first `# Summary` / `## Summary` / `### Summary` etc. heading.
  const headingRe = /^\s*(#{1,6})\s+(.+?)\s*$/;
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(headingRe);
    if (m && m[2].trim().toLowerCase() === 'summary') {
      startIdx = i + 1;
      break;
    }
  }
  if (startIdx === -1) return [];

  // Walk forward until next heading of any depth, or EOF.
  const facts = [];
  const bulletRe = /^\s*[-*]\s+(.*)$/;
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (headingRe.test(line)) break;
    const bm = line.match(bulletRe);
    if (bm) {
      const fact = bm[1].replace(/\s+$/, '');
      if (fact.length > 0) facts.push(fact);
    }
  }
  return facts;
}
