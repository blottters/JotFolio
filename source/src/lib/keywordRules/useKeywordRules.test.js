// Sanity test for the useKeywordRules hook. We don't try to exercise the full
// runtime behavior end-to-end here — the underlying pure modules
// (parseRules / applyRules / rulesStorage / optOutTracker) have their own
// dedicated test files (419+ tests) that cover algorithm correctness. This
// file just verifies the hook's public surface area is intact, since that's
// what App.jsx contracts against.

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeywordRules } from './useKeywordRules.js';

describe('useKeywordRules — module shape', () => {
  it('exports a function', () => {
    expect(typeof useKeywordRules).toBe('function');
  });

  it('takes a single options object argument', () => {
    expect(useKeywordRules.length).toBe(1);
  });
});

describe('useKeywordRules — return shape', () => {
  // Stub deps. vaultInfo=null + vaultLoading=false skips the boot-load effect's
  // I/O path entirely (the early return in the useEffect), so the hook
  // initializes cleanly without touching the vault adapter.
  function makeProps() {
    return {
      vaultAdapter: { readFile: async () => null, writeFile: async () => ({}) },
      vaultInfo: null,
      vaultLoading: false,
      saveEntry: async (e) => e,
      entries: [],
      toast: () => {},
      reportError: () => {},
    };
  }

  it('returns the 5 documented fields', () => {
    const { result } = renderHook(() => useKeywordRules(makeProps()));
    expect(result.current).toHaveProperty('keywordRules');
    expect(result.current).toHaveProperty('handleKeywordRulesChange');
    expect(result.current).toHaveProperty('saveEntryWithRules');
    expect(result.current).toHaveProperty('handleRescanVault');
    expect(result.current).toHaveProperty('clearProvenance');
  });

  it('initializes keywordRules as an empty rule set', () => {
    const { result } = renderHook(() => useKeywordRules(makeProps()));
    expect(result.current.keywordRules).toEqual({ rules: [] });
  });

  it('exposes the four handlers as functions', () => {
    const { result } = renderHook(() => useKeywordRules(makeProps()));
    expect(typeof result.current.handleKeywordRulesChange).toBe('function');
    expect(typeof result.current.saveEntryWithRules).toBe('function');
    expect(typeof result.current.handleRescanVault).toBe('function');
    expect(typeof result.current.clearProvenance).toBe('function');
  });
});
