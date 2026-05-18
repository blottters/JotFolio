import { describe, it, expect } from 'vitest';
import * as barrel from './index.js';

describe('compile barrel exports', () => {
  it('re-exports the documented Phase 4 surface', () => {
    for (const name of [
      'compile',
      'loadManifest',
      'saveManifest',
      'recordCompilation',
      'findStale',
      'isCompiledEntry',
      'EMPTY_MANIFEST',
      'hashSourceEntry',
      'hashCompiledArtifact',
      'compositeSourceHash',
      'compileDeterministic',
    ]) {
      expect(barrel[name], `missing export: ${name}`).toBeDefined();
    }
  });

  it('EMPTY_MANIFEST is a serializable plain object', () => {
    expect(typeof barrel.EMPTY_MANIFEST).toBe('object');
    // JSON-roundtrippable
    const json = JSON.parse(JSON.stringify(barrel.EMPTY_MANIFEST));
    expect(json).toEqual(barrel.EMPTY_MANIFEST);
  });
});
