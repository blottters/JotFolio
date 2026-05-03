// JotFolio accessibility spec — Playwright + @axe-core/playwright.
//
// Requires:
//   npm install
//   npx playwright install chromium
//   npm run dev         # separate terminal
//   npm run a11y        # runs this spec against localhost:5174
//
// CI: `source/.github/workflows/bench.yml` step "a11y" runs `npm run build`,
// `npx serve dist` on a background port, then `npx playwright test bench/a11y`.
//
// Results write to `a11y-results.json`. Any NEW violations (not listed in
// docs/perf/known-a11y-gaps.md) fail the suite.

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = process.env.A11Y_BASE_URL || 'http://localhost:5174';

async function seedApp(page) {
  await page.goto(BASE_URL);
  await page.evaluate(() => {
    const entries = [
      { id: 'a11y-1', type: 'note', title: 'Accessibility Test Note', tags: ['test'], status: 'active', starred: false, date: new Date().toISOString(), notes: 'Body', links: [] },
    ];
    localStorage.setItem('mgn-e', JSON.stringify(entries));
    localStorage.setItem('mgn-onboarded', JSON.stringify(true));
  });
  await page.reload();
  await page.waitForSelector('article', { timeout: 5000 });
}

test.describe('JotFolio WCAG AA flows', () => {
  test('main grid (all entries)', async ({ page }) => {
    await seedApp(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('detail panel (open an entry)', async ({ page }) => {
    await seedApp(page);
    await page.getByLabel('Open Accessibility Test Note').click();
    await page.waitForSelector('[role="dialog"]');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('settings modal', async ({ page }) => {
    await seedApp(page);
    await page.getByLabel('Settings').click();
    await page.waitForSelector('text=Appearance');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('add entry modal', async ({ page }) => {
    await seedApp(page);
    await page.keyboard.press('n');
    await page.waitForSelector('h3:has-text("New Entry")');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('quick-capture modal', async ({ page }) => {
    await seedApp(page);
    await page.keyboard.press('Shift+N');
    await page.waitForSelector('h3:has-text("Quick Note")');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
