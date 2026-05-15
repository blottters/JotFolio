import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));

describe('settings safety surfaces', () => {
  it('keeps settings-owned destructive actions out of browser confirm dialogs', () => {
    const source = [
      'SettingsPanel.jsx',
      'PluginsPanel.jsx',
      'PrivacyPanel.jsx',
      '../trash/TrashView.jsx',
    ].map(file => readFileSync(join(here, file), 'utf8')).join('\n');

    expect(source).not.toMatch(/window\.confirm/);
    expect(source).toContain('Permanently delete file');
    expect(source).toContain('BYOK connection setup only');
  });
});
