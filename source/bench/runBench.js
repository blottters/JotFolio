// bench/runBench.js — entrypoint for `npm run bench`.
//
// Loads all measurement modules, runs each with warmup+iterations, collects
// p50/p95/min/max, prints a stdout table, writes bench/baseline.json (when
// --update-baseline flag is passed) or compares against committed baseline.
//
// Zero runtime deps beyond project (marked is already in dependencies).
// tinybench would add convenience but not value at this scale.

import { performance } from 'node:perf_hooks';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import vaultMeasurements from './measure/vault.js';
import searchMeasurements from './measure/search.js';
import backlinkMeasurements from './measure/backlink.js';
import frontmatterMeasurements from './measure/frontmatter.js';
import parseMeasurements from './measure/parse.js';
import pluginMeasurements from './measure/plugin.js';

const BENCH_ROOT = dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = join(BENCH_ROOT, 'baseline.json');
const REGRESSION_THRESHOLD = 0.15; // 15%

const updateBaseline = process.argv.includes('--update-baseline');

// Measurements with their fail/warn designation + target
const TARGETS = {
  'vault-scan-1k':          { target: 200,  mode: 'fail' },
  'vault-scan-5k':          { target: 1000, mode: 'fail' },
  'vault-scan-10k':         { target: 2000, mode: 'warn' },
  'search-1k':              { target: 20,   mode: 'fail' },
  'search-5k':              { target: 100,  mode: 'fail' },
  'search-10k':             { target: 200,  mode: 'warn' },
  'backlink-rebuild-1k':    { target: 50,   mode: 'fail' },
  'backlink-rebuild-5k':    { target: 150,  mode: 'warn' },
  'autocomplete-render':    { target: 10,   mode: 'fail' },
  'md-parse-10kb':          { target: 5,    mode: 'fail' },
  'frontmatter-roundtrip':  { target: 50,   mode: 'fail' },
  'plugin-discover-5':      { target: 10,   mode: 'warn' },
  'plugin-discover-20':     { target: 30,   mode: 'warn' },
  'plugin-discover-50':     { target: 80,   mode: 'warn' },
};

const allMeasurements = [
  ...frontmatterMeasurements,
  ...parseMeasurements,
  ...searchMeasurements,
  ...backlinkMeasurements,
  ...pluginMeasurements,
  ...vaultMeasurements,
];

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return 0;
  const idx = Math.min(sortedValues.length - 1, Math.floor(sortedValues.length * p));
  return sortedValues[idx];
}

async function runOne(m) {
  const { id, fn, setup, warmup = 3, iterations = 10 } = m;
  const setupCtx = setup ? setup() : {};
  // Warmup
  for (let i = 0; i < warmup; i++) {
    await fn(setupCtx);
  }
  // Measured
  const timings = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    await fn(setupCtx);
    timings.push(performance.now() - t0);
  }
  timings.sort((a, b) => a - b);
  return {
    id,
    iterations,
    min:   timings[0],
    p50:   percentile(timings, 0.5),
    p95:   percentile(timings, 0.95),
    max:   timings[timings.length - 1],
    mean:  timings.reduce((a, b) => a + b, 0) / timings.length,
  };
}

function fmt(ms) { return ms < 1 ? ms.toFixed(2) + 'ms' : ms < 100 ? ms.toFixed(1) + 'ms' : Math.round(ms) + 'ms'; }

function printTable(results, baseline) {
  const rows = [['metric', 'p50', 'p95', 'min', 'max', 'target', 'vs baseline', 'verdict']];
  for (const r of results) {
    const t = TARGETS[r.id] || { target: null, mode: 'warn' };
    const base = baseline?.[r.id];
    const delta = base ? ((r.p95 - base.p95) / base.p95) : null;
    const deltaStr = delta == null ? '—' : `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}%`;
    let verdict = 'ok';
    if (t.target != null && r.p95 > t.target) verdict = t.mode === 'fail' ? 'FAIL(target)' : 'warn(target)';
    if (base && delta > REGRESSION_THRESHOLD) verdict = t.mode === 'fail' ? 'FAIL(regression)' : 'warn(regression)';
    rows.push([r.id, fmt(r.p50), fmt(r.p95), fmt(r.min), fmt(r.max), t.target == null ? '—' : fmt(t.target), deltaStr, verdict]);
  }
  const widths = rows[0].map((_, col) => Math.max(...rows.map(r => String(r[col]).length)));
  for (const row of rows) {
    console.log(row.map((c, i) => String(c).padEnd(widths[i])).join('  '));
  }
}

async function main() {
  console.log(`\nJotFolio bench — ${new Date().toISOString()}`);
  console.log(`Node ${process.version}  platform=${process.platform}  arch=${process.arch}\n`);

  let baseline = null;
  if (existsSync(BASELINE_PATH) && !updateBaseline) {
    try { baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')); }
    catch { baseline = null; }
  }

  const results = [];
  for (const m of allMeasurements) {
    process.stdout.write(`${m.id}… `);
    try {
      const r = await runOne(m);
      results.push(r);
      process.stdout.write(`p95 ${fmt(r.p95)}\n`);
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      results.push({ id: m.id, error: err.message });
    }
  }

  console.log('');
  printTable(results, baseline?.measurements);

  // Exit code logic
  let failed = false;
  for (const r of results) {
    if (r.error) { failed = true; continue; }
    const t = TARGETS[r.id];
    if (!t) continue;
    const overTarget = t.target != null && r.p95 > t.target;
    const base = baseline?.measurements?.[r.id];
    const regressed = base && ((r.p95 - base.p95) / base.p95) > REGRESSION_THRESHOLD;
    if (t.mode === 'fail' && (overTarget || regressed)) failed = true;
  }

  if (updateBaseline) {
    const out = {
      updatedAt: new Date().toISOString(),
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      threshold: REGRESSION_THRESHOLD,
      measurements: Object.fromEntries(results.filter(r => !r.error).map(r => [r.id, {
        p50: r.p50, p95: r.p95, min: r.min, max: r.max, mean: r.mean,
      }])),
    };
    writeFileSync(BASELINE_PATH, JSON.stringify(out, null, 2));
    console.log(`\nBaseline written to ${BASELINE_PATH}`);
  }

  if (failed && !updateBaseline) {
    console.error('\nBench FAILED: one or more fail-mode metrics exceeded target or regressed >15%.');
    process.exit(1);
  }
  console.log('\nBench complete.');
}

main().catch(err => { console.error(err); process.exit(1); });
