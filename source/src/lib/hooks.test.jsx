import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useEscapeKey, useSystemDark } from './hooks.js';

function EscapeHarness({ onDismiss, includeEditableTargets = false }) {
  const [content, setContent] = useState('editable');
  useEscapeKey(true, onDismiss, { includeEditableTargets });
  return (
    <div>
      <input aria-label="Input" />
      <textarea aria-label="Textarea" />
      <select aria-label="Select"><option>One</option></select>
      <div
        aria-label="Editor"
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => setContent(e.currentTarget.textContent)}
      >
        {content}
      </div>
      <button type="button">Button</button>
    </div>
  );
}

function SystemDarkHarness() {
  const isDark = useSystemDark();
  return <div>{isDark ? 'dark' : 'light'}</div>;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useEscapeKey', () => {
  it('ignores Escape from editable targets by default', () => {
    const onDismiss = vi.fn();
    render(<EscapeHarness onDismiss={onDismiss} />);

    fireEvent.keyDown(screen.getByLabelText('Input'), { key: 'Escape' });
    fireEvent.keyDown(screen.getByLabelText('Textarea'), { key: 'Escape' });
    fireEvent.keyDown(screen.getByLabelText('Select'), { key: 'Escape' });
    fireEvent.keyDown(screen.getByLabelText('Editor'), { key: 'Escape' });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('dismisses from non-editable targets and can opt into editable targets', () => {
    const onDismiss = vi.fn();
    const { rerender } = render(<EscapeHarness onDismiss={onDismiss} />);

    fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);

    rerender(<EscapeHarness onDismiss={onDismiss} includeEditableTargets />);
    fireEvent.keyDown(screen.getByLabelText('Input'), { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });
});

describe('useSystemDark', () => {
  it('reads prefers-color-scheme through matchMedia', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const matchMedia = vi.fn(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addEventListener,
      removeEventListener,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal('matchMedia', matchMedia);

    render(<SystemDarkHarness />);

    expect(screen.getByText('dark')).toBeTruthy();
    expect(matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
