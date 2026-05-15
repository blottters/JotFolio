import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrivacyPanel } from './PrivacyPanel.jsx';

const telemetry = vi.hoisted(() => ({
  optedIn: false,
  decided: false,
  userOptedIn: vi.fn(() => telemetry.optedIn),
  setOptIn: vi.fn(value => {
    telemetry.optedIn = value;
    telemetry.decided = true;
  }),
  hasDecided: vi.fn(() => telemetry.decided),
  hydrateOptInFromMain: vi.fn(async () => telemetry.optedIn),
}));

vi.mock('../../lib/telemetry.js', () => telemetry);

describe('PrivacyPanel', () => {
  beforeEach(() => {
    telemetry.optedIn = false;
    telemetry.decided = false;
    vi.clearAllMocks();
  });

  it('gives the crash-report toggle an accessible action name', async () => {
    render(<PrivacyPanel />);

    const toggle = await screen.findByRole('button', { name: 'Enable crash reports' });
    fireEvent.click(toggle);

    expect(telemetry.setOptIn).toHaveBeenCalledWith(true);
  });
});
