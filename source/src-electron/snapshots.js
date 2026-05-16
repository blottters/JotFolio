// Recovery snapshot writer.
//
// Every save of a note triggers a debounced snapshot (60s window).
// Snapshots live under `<vault>/.jotfolio/recovery/<iso-date>/<relative-path>.md`
// Retention: 7 daily + 4 weekly + 3 monthly. 500 MB total cap.
//
// Runs inside Electron main process because it needs `fs` — browser LocalAdapter
// users don't get snapshots (their vault is already transient).

const path = require('node:path');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');

const RECOVERY_DIR = '.jotfolio/recovery';
const SIZE_CAP_BYTES = 500 * 1024 * 1024;

let vaultRoot = null;
let pending = new Map();         // relPath → debounce timer
let lastSnapshotAt = new Map();  // relPath → timestamp
const DEBOUNCE_MS = 60_000;

function validateRelativePath(relPath) {
  if (typeof relPath !== 'string' || !relPath) throw new Error('Invalid snapshot path');
  if (relPath.includes('\\')) throw new Error('Snapshot path must use forward slashes');
  if (path.isAbsolute(relPath)) throw new Error('Snapshot path must be relative');
  const normalized = relPath.replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');
  if (!normalized || normalized.split('/').some(seg => !seg || seg === '.' || seg === '..')) {
    throw new Error('Snapshot path escape attempt');
  }
  return normalized;
}

function resolveVaultPath(relPath) {
  if (!vaultRoot) throw new Error('No vault');
  const root = path.resolve(vaultRoot);
  const rel = validateRelativePath(relPath);
  const absolute = path.resolve(root, rel);
  if (!absolute.startsWith(root + path.sep) && absolute !== root) {
    throw new Error('Snapshot path escape attempt');
  }
  return absolute;
}

function validateSnapshotDate(snapshotDate) {
  if (typeof snapshotDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(snapshotDate)) {
    throw new Error('Invalid snapshot date');
  }
  const [year, month, day] = snapshotDate.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    throw new Error('Invalid snapshot date');
  }
  return snapshotDate;
}

function setVaultRoot(root) {
  vaultRoot = root;
  pending.forEach(clearTimeout);
  pending.clear();
  lastSnapshotAt.clear();
}

// Called from vault:write handler on main.js after the user file is written.
function schedule(relPath) {
  if (!vaultRoot) return;
  if (relPath.startsWith(RECOVERY_DIR + '/')) return; // don't snapshot snapshots
  if (relPath.startsWith('.jotfolio/')) return;        // plugins + settings don't need recovery

  if (pending.has(relPath)) clearTimeout(pending.get(relPath));

  const t = setTimeout(async () => {
    pending.delete(relPath);
    try { await take(relPath); }
    catch (err) { console.warn('snapshot failed for', relPath, err.message); }
  }, DEBOUNCE_MS);
  pending.set(relPath, t);
}

async function take(relPath) {
  if (!vaultRoot) return;
  let src;
  let rel;
  try {
    src = resolveVaultPath(relPath);
    rel = validateRelativePath(relPath);
  } catch { return; }
  let content;
  try { content = await fs.readFile(src, 'utf8'); }
  catch { return; }

  const iso = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const dstDir = path.resolve(vaultRoot, RECOVERY_DIR, iso, path.dirname(rel));
  const dstFile = path.join(dstDir, path.basename(rel));
  await fs.mkdir(dstDir, { recursive: true });
  await fs.writeFile(dstFile, content, 'utf8');
  lastSnapshotAt.set(rel, Date.now());
}

// Return list of snapshots for a given note, newest first.
async function list(relPath) {
  if (!vaultRoot) return [];
  const rel = validateRelativePath(relPath);
  const recRoot = path.resolve(vaultRoot, RECOVERY_DIR);
  const out = [];
  let dateDirs;
  try { dateDirs = await fs.readdir(recRoot, { withFileTypes: true }); }
  catch { return []; }
  for (const d of dateDirs) {
    if (!d.isDirectory()) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.name)) continue;
    const candidate = path.join(recRoot, d.name, rel);
    try {
      const stat = await fs.stat(candidate);
      out.push({ date: d.name, mtime: stat.mtimeMs, size: stat.size, absPath: candidate });
    } catch { /* missing this day, skip */ }
  }
  out.sort((a, b) => b.mtime - a.mtime);
  return out;
}

async function restore(relPath, snapshotDate) {
  if (!vaultRoot) throw new Error('No vault');
  const date = validateSnapshotDate(snapshotDate);
  const rel = validateRelativePath(relPath);
  const recRoot = path.resolve(vaultRoot, RECOVERY_DIR);
  const dateRoot = path.resolve(recRoot, date);
  const src = path.resolve(dateRoot, rel);
  const dst = resolveVaultPath(rel);
  if (!src.startsWith(dateRoot + path.sep)) {
    throw new Error('Snapshot path escape attempt');
  }
  const content = await fs.readFile(src, 'utf8');
  const tmp = dst + '.restore.tmp';
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.writeFile(tmp, content, 'utf8');
  await fs.rename(tmp, dst);
}

// Retention: 7 daily, 4 weekly, 3 monthly. Called periodically.
async function prune() {
  if (!vaultRoot) return;
  const recRoot = path.resolve(vaultRoot, RECOVERY_DIR);
  let dateDirs;
  try { dateDirs = await fs.readdir(recRoot, { withFileTypes: true }); }
  catch { return; }

  const dates = dateDirs.filter(d => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name))
                         .map(d => d.name).sort().reverse(); // newest first

  const keep = new Set();
  // Last 7 days
  dates.slice(0, 7).forEach(d => keep.add(d));
  // Weekly: pick first date of each prior week, up to 4
  const weeklyCursor = new Date();
  for (let i = 0; i < 4; i++) {
    weeklyCursor.setDate(weeklyCursor.getDate() - 7);
    const iso = weeklyCursor.toISOString().slice(0, 10);
    const match = dates.find(d => d <= iso);
    if (match) keep.add(match);
  }
  // Monthly: pick first date of each prior month, up to 3
  const monthlyCursor = new Date();
  for (let i = 0; i < 3; i++) {
    monthlyCursor.setMonth(monthlyCursor.getMonth() - 1);
    const iso = monthlyCursor.toISOString().slice(0, 10);
    const match = dates.find(d => d <= iso);
    if (match) keep.add(match);
  }

  for (const d of dates) {
    if (!keep.has(d)) {
      try { await fs.rm(path.join(recRoot, d), { recursive: true, force: true }); }
      catch { /* noop */ }
    }
  }

  // Enforce size cap — walk remaining, oldest-first, delete until under cap
  const remaining = [...keep].sort(); // oldest first
  let total = 0;
  const sizes = new Map();
  for (const d of remaining) {
    const size = dirSize(path.join(recRoot, d));
    sizes.set(d, size);
    total += size;
  }
  while (total > SIZE_CAP_BYTES && remaining.length > 3) {
    const victim = remaining.shift();
    try { await fs.rm(path.join(recRoot, victim), { recursive: true, force: true }); } catch { /* noop */ }
    total -= (sizes.get(victim) || 0);
  }
}

function dirSize(p) {
  let total = 0;
  try {
    const entries = fsSync.readdirSync(p, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(p, e.name);
      if (e.isDirectory()) total += dirSize(full);
      else total += fsSync.statSync(full).size;
    }
  } catch { /* noop */ }
  return total;
}

// Hourly prune schedule
let pruneTimer = null;
function startPrune() {
  if (pruneTimer) return;
  pruneTimer = setInterval(() => { prune().catch(() => {}); }, 60 * 60 * 1000);
  prune().catch(() => {});
}

module.exports = { setVaultRoot, schedule, list, restore, prune, startPrune };
