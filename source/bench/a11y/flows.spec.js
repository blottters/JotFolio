// JotFolio accessibility spec — Playwright + @axe-core/playwright.
//
// Requires:
//   npm install
//   npx playwright install chromium
//   npm run dev         # separate terminal, served at http://127.0.0.1:5174
//   npm run a11y        # runs this spec against 127.0.0.1:5174
//
// CI: `source/.github/workflows/bench.yml` step "a11y" runs `npm run build`,
// `npx serve dist` on a background port, then `npx playwright test bench/a11y`.
//
// Results write to `a11y-results.json`. Any NEW violations (not listed in
// docs/perf/known-a11y-gaps.md) fail the suite.

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = process.env.A11Y_BASE_URL || 'http://127.0.0.1:5174';

const KNOWN_GAPS = {};

function isKnownNode(violation, node, knownGaps = []) {
  return knownGaps.some(gap => (
    violation.id === gap.id
    && node.target?.join(' ') === gap.target
  ));
}

function withoutKnownGaps(violations, knownGaps = []) {
  return violations
    .map(violation => ({
      ...violation,
      nodes: violation.nodes.filter(node => !isKnownNode(violation, node, knownGaps)),
    }))
    .filter(violation => violation.nodes.length > 0);
}

function expectNoUnexpectedViolations(results, knownGaps = []) {
  const unexpected = withoutKnownGaps(results.violations, knownGaps);
  expect(unexpected, JSON.stringify(unexpected, null, 2)).toEqual([]);
}

async function seedApp(page) {
  await page.goto(BASE_URL);
  await page.evaluate(() => {
    const note = [
      '---',
      'id: a11y-1',
      'type: note',
      'title: Accessibility Test Note',
      'tags: [test, product]',
      'status: active',
      'starred: false',
      'created: 2026-05-14T09:00:00.000Z',
      'modified: 2026-05-14T09:00:00.000Z',
      'entry_date: 2026-05-14',
      'links: []',
      '---',
      'Body',
      '',
    ].join('\n');
    const task = [
      '---',
      'id: a11y-task-1',
      'type: task',
      'title: Accessibility Test Task',
      'tags: [test]',
      'status: open',
      'starred: false',
      'created: 2026-05-14T09:00:00.000Z',
      'modified: 2026-05-14T09:00:00.000Z',
      'due: 2026-05-14',
      'priority: high',
      'links: [a11y-1]',
      '---',
      'Keyboard and route sweep task.',
      '',
    ].join('\n');
    localStorage.setItem('jf-vault-local', JSON.stringify({
      files: {
        'notes/Accessibility Test Note.md': note,
        'tasks/Accessibility Test Task.md': task,
      },
      mtimes: {
        'notes/Accessibility Test Note.md': Date.now(),
        'tasks/Accessibility Test Task.md': Date.now(),
      },
      folders: {},
    }));
    localStorage.setItem('mgn-onboarded', JSON.stringify(true));
    localStorage.setItem('mgn-vault-migrated', JSON.stringify(true));
  });
  await page.reload();
  await page.getByRole('heading', { name: /Good morning/i }).waitFor({ timeout: 7000 });
}

test.describe('JotFolio WCAG AA flows', () => {
  test('command center shell', async ({ page }) => {
    await seedApp(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expectNoUnexpectedViolations(results);
  });

  test('global search route', async ({ page }) => {
    await seedApp(page);
    await page.getByRole('button', { name: /Search/ }).click();
    await page.getByRole('heading', { name: 'Search / Quick Switcher' }).waitFor();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expectNoUnexpectedViolations(results);
  });

  test('settings route', async ({ page }) => {
    await seedApp(page);
    await page.getByRole('button', { name: /Settings/ }).click();
    await page.getByRole('region', { name: 'Settings' }).waitFor();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expectNoUnexpectedViolations(results);
  });

  test('capture modal from top bar', async ({ page }) => {
    await seedApp(page);
    await page.getByRole('button', { name: 'Capture', exact: true }).click();
    await page.waitForSelector('[role="dialog"]');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expectNoUnexpectedViolations(results);
  });

  test('quick-capture modal', async ({ page }) => {
    await seedApp(page);
    await page.keyboard.press('Shift+N');
    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor();
    await expect(dialog).toContainText('Capture / New Entry');
    await expect(dialog).not.toContainText('Choose entry type');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expectNoUnexpectedViolations(results);
  });
});
