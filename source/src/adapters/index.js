// Runtime adapter picker. Imported as `import { vault } from '@/adapters'`
// (or `../adapters` etc.). Auto-detects environment:
//
//   - window.electron.vault present → NodeFsAdapter (Electron main process fs)
//   - otherwise → LocalAdapter (browser localStorage)
//
// Future: add WebFsaAdapter (File System Access API) when web build ships;
// add CapacitorFsAdapter when mobile ships. Picker extends, adapter-consumer
// React tree stays unchanged.

import { NodeFsAdapter } from './NodeFsAdapter.js';
import { LocalAdapter } from './LocalAdapter.js';

function detect() {
  if (typeof window !== 'undefined' && window.electron?.vault) {
    return new NodeFsAdapter();
  }
  return new LocalAdapter();
}

export const vault = detect();
export { VaultError } from './VaultError.js';
export { LocalAdapter, NodeFsAdapter };
export { VaultAdapter } from './VaultAdapter.js';
