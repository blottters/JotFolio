// Bundles the official plugin source files at build time so they can be
// written into the user's vault without touching the filesystem outside it.
// Uses Vite's `?raw` import suffix — content becomes a string constant in
// the bundle. Keep this list tight; each new plugin added here inflates
// the main bundle until we switch to lazy imports (post-0.5.0).

import dailyNotesManifest from '../../plugins/daily-notes/manifest.json?raw';
import dailyNotesMain from '../../plugins/daily-notes/main.js?raw';

import { vault } from '../adapters/index.js';

/**
 * @typedef {Object} OfficialPlugin
 * @property {string} id
 * @property {string} name
 * @property {string} version
 * @property {string} description
 * @property {Object} manifest            - Parsed manifest.json
 * @property {Array<{ path: string, content: string }>} files
 */

/** @type {OfficialPlugin[]} */
export const OFFICIAL_PLUGINS = [
  wrap('daily-notes', dailyNotesManifest, dailyNotesMain),
];

function wrap(id, manifestRaw, mainRaw) {
  const manifest = JSON.parse(manifestRaw);
  return {
    id,
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    manifest,
    files: [
      { path: `.jotfolio/plugins/${id}/manifest.json`, content: manifestRaw },
      { path: `.jotfolio/plugins/${id}/main.js`, content: mainRaw },
    ],
  };
}

/**
 * Write an official plugin's files into the active vault. Returns
 * { installed, alreadyPresent }. Does not enable it — caller decides.
 */
export async function installOfficial(pluginId) {
  const plugin = OFFICIAL_PLUGINS.find(p => p.id === pluginId);
  if (!plugin) throw new Error(`Unknown official plugin: ${pluginId}`);

  // Check if already installed
  const existing = await vault.list();
  const manifestPath = `.jotfolio/plugins/${pluginId}/manifest.json`;
  const alreadyPresent = existing.some(f => f.path === manifestPath);

  for (const file of plugin.files) {
    await vault.write(file.path, file.content);
  }
  return { installed: plugin.id, alreadyPresent };
}
