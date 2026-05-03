// JotFolio accessibility spec — Playwright + @axe-core/playwright.
//
// Requires:
//   npm install
//   npx playwright install chromium
//   npm run dev         # separate terminal
//   npm run a11y        # runs this spec against localhost:5174
//
// CI: `.github/workflows/bench.yml` step "a11y" runs `npm run build`,
// `npx serve dist` on a background port, then `npx playwright test bench/a11y`.
//
// Results write to `a11y-results.json`. Any NEW violations (not listed in
// docs/perf/known-a11y-gaps.md) fail the suite.

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = process.env.A11Y_BASE_URL || 'http://localhost:5174';

const sampleEntries = [
  {
    id: 'a11y-1',
    type: 'note',
    title: 'Accessibility Test Note',
    tags: ['test'],
    status: 'active',
    starred: false,
    date: new Date().toISOString(),
    notes: 'Body',
    links: [],
  },
];

async function bootApp(page, entries = []) {
  await page.goto(BASE_URL);
  await page.evaluate(seed => {
    localStorage.setItem('mgn-onboarded', 'true');
    localStorage.setItem('mgn-e', JSON.stringify(seed.entries));
    localStorage.setItem('mgn-activation', JSON.stringify({
      firstSaveAt: seed.entries[0]?.date || null,
      thirdSaveAt: seed.entries[2]?.date || null,
      lastSeenAt: new Date().toISOString(),
      bannersDismissed: [],
    }));
  }, { entries });
  await page.reload();
}

test.describe('JotFolio WCAG AA flows', () => {
  test('main grid (all entries)', async ({ page }) => {
    await bootApp(page, sampleEntries);
    await page.waitForSelector('article', { timeout: 3000 });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('detail panel (open an entry)', async ({ page }) => {
    await bootApp(page, sampleEntries);
    await page.getByRole('button', { name: 'Open Accessibility Test Note' }).click();
    await page.waitForSelector('[role="dialog"]');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('settings modal', async ({ page }) => {
    await bootApp(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.waitForSelector('text=Appearance');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('add entry modal', async ({ page }) => {
    await bootApp(page);
    await page.getByRole('button', { name: 'New entry (N)' }).click();
    await page.waitForSelector('h3:has-text("New Entry")');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('quick-capture modal', async ({ page }) => {
    await bootApp(page);
    await page.getByRole('heading', { name: 'All Entries' }).click();
    await page.keyboard.down('Shift');
    await page.keyboard.press('N');
    await page.keyboard.up('Shift');
    await page.waitForSelector('h3:has-text("Quick Note")');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
