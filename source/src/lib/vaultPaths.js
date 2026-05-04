export function normalizeVaultFolder(input) {
  const raw = String(input || '').trim().replaceAll('\\', '/');
  if (!raw || raw === '.') return '';
  const collapsed = raw.replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');
  if (!collapsed) return '';
  if (/^[a-z]:/i.test(collapsed)) throw new Error('Use a vault-relative folder, not a drive path.');
  if (collapsed.split('/').some(seg => !seg || seg === '.' || seg === '..')) {
    throw new Error('Folder cannot contain empty, current, or parent path segments.');
  }
  return collapsed;
}

export function normalizeMarkdownFileName(input) {
  const raw = String(input || '').trim().replaceAll('\\', '/').split('/').pop() || '';
  const name = raw.endsWith('.md') ? raw : `${raw}.md`;
  if (!raw || name === '.md') throw new Error('File name is required.');
  if (name.includes('/') || name.includes('\\')) throw new Error('File name cannot include folders.');
  if (name === '.' || name === '..' || name.includes('..')) throw new Error('File name cannot contain parent path refs.');
  return name;
}

export function joinVaultPath(folder, name) {
  const cleanFolder = normalizeVaultFolder(folder);
  const cleanName = normalizeMarkdownFileName(name);
  return cleanFolder ? `${cleanFolder}/${cleanName}` : cleanName;
}

export function folderFromPath(path) {
  const rel = String(path || '').replaceAll('\\', '/');
  const idx = rel.lastIndexOf('/');
  return idx === -1 ? '' : rel.slice(0, idx);
}

export function fileNameFromPath(path) {
  const rel = String(path || '').replaceAll('\\', '/');
  const idx = rel.lastIndexOf('/');
  return idx === -1 ? rel : rel.slice(idx + 1);
}

export function folderContainsPath(folder, entryPath) {
  const cleanFolder = normalizeVaultFolder(folder);
  if (!cleanFolder) return false;
  const entryFolder = folderFromPath(entryPath);
  return entryFolder === cleanFolder || entryFolder.startsWith(`${cleanFolder}/`);
}

export function isInternalVaultPath(path) {
  const rel = String(path || '').replaceAll('\\', '/').replace(/^\/+/, '');
  return rel === '.jotfolio'
    || rel.startsWith('.jotfolio/')
    || rel === '_jotfolio'
    || rel.startsWith('_jotfolio/');
}

export function buildFolderTree(entries = [], explicitFolders = []) {
  const counts = new Map();
  const ensureFolder = (folder) => {
    const clean = normalizeVaultFolder(folder);
    if (!clean || isInternalVaultPath(clean)) return;
    const parts = clean.split('/');
    for (let i = 1; i <= parts.length; i += 1) {
      const key = parts.slice(0, i).join('/');
      counts.set(key, counts.get(key) || 0);
    }
  };
  for (const folder of explicitFolders) ensureFolder(folder);
  for (const entry of entries) {
    const folder = normalizeVaultFolder(entry?._path ? folderFromPath(entry._path) : '');
    if (!folder || isInternalVaultPath(folder)) continue;
    ensureFolder(folder);
    counts.set(folder, (counts.get(folder) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([path, count]) => ({
      path,
      name: path.split('/').pop(),
      depth: path.split('/').length - 1,
      count,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}
