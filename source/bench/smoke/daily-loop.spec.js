// Batch 0 baseline smoke.
//
// This is the product loop JotFolio is not allowed to break:
// blank vault -> Capture -> Inbox -> convert -> Notes -> Search -> Graph Health -> Trash/Recovery.

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:5174';
const SMOKE_URL = BASE_URL.includes('?') ? `${BASE_URL}&smoke=1` : `${BASE_URL}?smoke=1`;
const CAPTURE_TITLE = 'Batch 0 raw capture';
const CAPTURE_BODY = 'This starts as raw inbox material and becomes a real note.';

async function resetBlankVault(page) {
  await page.goto(SMOKE_URL);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('jf-vault-local', JSON.stringify({
      files: {},
      mtimes: {},
      folders: {},
    }));
  });
  await page.reload();
}

async function expectNoConsoleErrors(consoleErrors) {
  expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
}

function navButton(page, label) {
  return page.getByRole('navigation').getByRole('button', { name: new RegExp(label) });
}

test.describe('Batch 0 daily-loop smoke', () => {
  test('proves the blank-vault daily loop without demo data', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });

    await resetBlankVault(page);

    await expect(page.getByRole('heading', { name: 'Your local-first synthesis vault' })).toBeVisible();
    await page.getByRole('button', { name: 'Capture raw thought' }).click();

    const captureDialog = page.getByRole('dialog', { name: 'Capture / New Entry' });
    await expect(captureDialog).toBeVisible();
    await captureDialog.getByRole('radio', { name: 'Raw' }).click();
    await captureDialog.getByLabel('Title').fill(CAPTURE_TITLE);
    await captureDialog.getByLabel('Add tag').fill('baseline');
    await captureDialog.getByLabel('Add tag').press('Enter');
    await captureDialog.getByPlaceholder('Start writing or paste your content...').fill(CAPTURE_BODY);
    await captureDialog.getByRole('button', { name: 'Save to Inbox' }).click();
    await expect(captureDialog).toBeHidden();

    await navButton(page, 'Inbox').click();
    await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();
    await expect(page.getByRole('button', { name: `Open ${CAPTURE_TITLE}` })).toBeVisible();
    await page.getByRole('button', { name: `Make Note from ${CAPTURE_TITLE}` }).click();

    const detailPanel = page.getByRole('dialog', { name: CAPTURE_TITLE });
    await expect(detailPanel).toBeVisible();
    await detailPanel.getByRole('button', { name: 'Close panel' }).click();

    await navButton(page, 'Notes').click();
    await expect(page.getByRole('region', { name: 'Notes Markdown Editor' })).toBeVisible();
    await expect(page.getByText(CAPTURE_TITLE).first()).toBeVisible();

    await navButton(page, 'Search').click();
    await expect(page.getByRole('heading', { name: 'Search / Quick Switcher' })).toBeVisible();
    await page.locator('input[placeholder="Search notes, projects, people, tags..."]').last().fill('Batch 0');
    await expect(page.getByRole('button', { name: `Select ${CAPTURE_TITLE}` }).first()).toBeVisible();

    await navButton(page, 'Constellation').click();
    await expect(page.getByRole('heading', { name: 'Constellation' })).toBeVisible();
    await page.getByRole('button', { name: 'Graph Health' }).click();
    const graphHealth = page.getByRole('region', { name: 'Graph Health' });
    await expect(graphHealth).toBeVisible();

    await graphHealth.getByRole('button', { name: `Open ${CAPTURE_TITLE}` }).click();
    await expect(detailPanel).toBeVisible();
    await detailPanel.getByRole('button', { name: 'Delete entry' }).click();
    await page.getByRole('button', { name: 'Yes' }).click();
    await expect(detailPanel).toBeHidden();

    await page.getByRole('button', { name: /Trash/ }).click();
    await expect(page.getByRole('heading', { name: 'JotFolio Trash' })).toBeVisible();
    await expect(page.getByText(CAPTURE_TITLE)).toBeVisible();

    const vaultState = await page.evaluate(() => JSON.parse(localStorage.getItem('jf-vault-local') || '{}'));
    const paths = Object.keys(vaultState.files || {});
    expect(paths.some(path => path.includes('.jotfolio/trash/'))).toBe(true);
    expect(paths.some(path => path.startsWith('notes/') && path.includes('Batch 0 raw capture'))).toBe(false);

    await expectNoConsoleErrors(consoleErrors);
  });
});
