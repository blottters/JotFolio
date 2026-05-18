import React, { useRef, useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import { _dropdownBus, useSingleOpenDropdown, useClickOutside } from './bus.js';

describe('dropdown bus exports', () => {
  it('exposes a singleton EventTarget', () => {
    expect(_dropdownBus).toBeInstanceOf(EventTarget);
  });
});

function Dropdown({ open, onClose }) {
  useSingleOpenDropdown(open, onClose);
  return <div data-open={open} />;
}

describe('useSingleOpenDropdown', () => {
  it('closes other open dropdowns when a new one opens', () => {
    let closedA = false;
    render(<Dropdown open={true} onClose={() => { closedA = true; }} />);
    // Mount a second open dropdown — should fire close on the first.
    render(<Dropdown open={true} onClose={() => {}} />);
    expect(closedA).toBe(true);
  });

  it('is a no-op when open=false', () => {
    let called = false;
    render(<Dropdown open={false} onClose={() => { called = true; }} />);
    // Dispatching open shouldn't reach this dropdown since it didn't subscribe
    _dropdownBus.dispatchEvent(new CustomEvent('open', { detail: {} }));
    expect(called).toBe(false);
  });
});

function ClickAwayBox({ onClose, active }) {
  const ref = useRef(null);
  useClickOutside(ref, onClose, active);
  return <div ref={ref} data-testid="box">inside</div>;
}

describe('useClickOutside', () => {
  it('invokes onClose when mousedown happens outside the ref', () => {
    let closed = false;
    render(<ClickAwayBox onClose={() => { closed = true; }} active={true} />);
    act(() => {
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(closed).toBe(true);
  });

  it('does nothing when active=false', () => {
    let closed = false;
    render(<ClickAwayBox onClose={() => { closed = true; }} active={false} />);
    act(() => {
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(closed).toBe(false);
  });
});
