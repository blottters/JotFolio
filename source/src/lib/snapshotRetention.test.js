// Snapshot retention logic is pure date math; test in isolation.
// Main fs interaction tested manually per src-electron/README.md.

import { describe, it, expect } from 'vitest';

// Re-implement the retention window selection so it can be tested without
// pulling in Electron's fs-coupled module.
function pickRetained(dates, today = new Date()) {
  dates = [...dates].sort().reverse(); // newest first
  const keep = new Set();
  dates.slice(0, 7).forEach(d => keep.add(d));
  const weekly = new Date(today);
  for (let i = 0; i < 4; i++) {
    weekly.setDate(weekly.getDate() - 7);
    const iso = weekly.toISOString().slice(0, 10);
    const match = dates.find(d => d <= iso);
    if (match) keep.add(match);
  }
  const monthly = new Date(today);
  for (let i = 0; i < 3; i++) {
    monthly.setMonth(monthly.getMonth() - 1);
    const iso = monthly.toISOString().slice(0, 10);
    const match = dates.find(d => d <= iso);
    if (match) keep.add(match);
  }
  return keep;
}

describe('snapshot retention window', () => {
  it('keeps last 7 daily snapshots', () => {
    const today = new Date('2026-04-23');
    const dates = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    });
    const keep = pickRetained(dates, today);
    expect(keep.size).toBeGreaterThanOrEqual(7);
    // today through 6 days ago all present
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      expect(keep.has(d.toISOString().slice(0, 10))).toBe(true);
    }
  });

  it('adds weekly entries for the 4 weeks prior', () => {
    const today = new Date('2026-04-23');
    // Build 60 daily dates
    const dates = Array.from({ length: 60 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    });
    const keep = pickRetained(dates, today);
    // Should include at least 4 older-than-7-days entries (the weekly picks)
    const olderThanSeven = [...keep].filter(d => {
      const dd = new Date(d);
      return (today.getTime() - dd.getTime()) > 7 * 86400000;
    });
    expect(olderThanSeven.length).toBeGreaterThanOrEqual(4);
  });

  it('adds monthly entries for the 3 months prior', () => {
    const today = new Date('2026-04-23');
    const dates = Array.from({ length: 120 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    });
    const keep = pickRetained(dates, today);
    const olderThanMonth = [...keep].filter(d => {
      const dd = new Date(d);
      return (today.getTime() - dd.getTime()) > 30 * 86400000;
    });
    expect(olderThanMonth.length).toBeGreaterThanOrEqual(3);
  });

  it('empty input returns empty set', () => {
    expect(pickRetained([]).size).toBe(0);
  });

  it('fewer than 7 available returns them all', () => {
    const today = new Date('2026-04-23');
    const dates = ['2026-04-22', '2026-04-21', '2026-04-20'];
    const keep = pickRetained(dates, today);
    expect(keep.size).toBe(3);
  });
});
