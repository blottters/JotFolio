import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { UpdateBanner } from './UpdateBanner.jsx';

describe('UpdateBanner', () => {
  afterEach(() => {
    delete window.electron;
  });

  it('renders nothing when no updater bridge is available', () => {
    const { container } = render(<UpdateBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a ready banner when the updater fires a ready status', () => {
    let listener;
    window.electron = {
      updater: {
        onStatus: (cb) => { listener = cb; return () => {}; },
        installNow: () => Promise.resolve(),
      },
    };
    render(<UpdateBanner />);
    act(() => { listener({ state: 'ready', version: '1.2.3' }); });
    expect(screen.getByRole('status')).toHaveTextContent('Update 1.2.3 ready');
  });
});
