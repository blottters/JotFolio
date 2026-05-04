// Barrel re-exports for the Karpathy Phase 4 compilation pipeline.
// Phase 5 UI imports from here:
//   import { compile, loadManifest, saveManifest, recordCompilation, findStale, isCompiledEntry } from '../lib/compile';

export { compile } from './compile.js';
export {
  loadManifest,
  saveManifest,
  recordCompilation,
  findStale,
  isCompiledEntry,
  EMPTY_MANIFEST,
} from './manifest.js';
export {
  hashSourceEntry,
  hashCompiledArtifact,
  compositeSourceHash,
} from './hash.js';
export { compileDeterministic } from './compilers/deterministicStub.js';
