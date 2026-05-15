import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PluginsPanel } from './PluginsPanel.jsx';

const host = vi.hoisted(() => ({
  records: [],
  discover: vi.fn(async () => {}),
  list: vi.fn(() => host.records),
  subscribe: vi.fn(() => vi.fn()),
  enable: vi.fn(async () => {}),
  disable: vi.fn(async () => {}),
  uninstall: vi.fn(async () => {}),
}));

vi.mock('../../plugins/PluginHost.js', () => ({
  pluginHost: host,
}));

vi.mock('../../plugins/officialPlugins.js', () => ({
  OFFICIAL_PLUGINS: [],
  installOfficial: vi.fn(async () => {}),
}));

describe('PluginsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    host.records = [
      {
        status: 'disabled',
        manifest: {
          id: 'risky-plugin',
          name: 'Risky Plugin',
          version: '1.0.0',
          description: 'Writes vault files',
          permissions: { vault_write: true },
        },
      },
    ];
  });

  it('names plugin toggles and confirms risky enables before calling the host', async () => {
    render(<PluginsPanel />);

    expect(await screen.findByText('Risky Plugin')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Enable Risky Plugin' }));

    const confirm = screen.getByRole('group', { name: 'Confirm enable Risky Plugin' });
    expect(confirm).toBeInTheDocument();
    expect(host.enable).not.toHaveBeenCalled();

    fireEvent.click(within(confirm).getByRole('button', { name: 'Enable' }));

    await waitFor(() => expect(host.enable).toHaveBeenCalledWith('risky-plugin'));
  });
});
