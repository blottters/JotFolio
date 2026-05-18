import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgressPill, FirstSaveBanner, GraphLockOverlay, ActivationToast } from './nudges.jsx';

beforeEach(() => {
  localStorage.clear();
});

describe('nudges', () => {
  it('ProgressPill returns null at 3+ entries', () => {
    const { container } = render(<ProgressPill count={3} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('ProgressPill shows N/3 below 3', () => {
    render(<ProgressPill count={1} />);
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('FirstSaveBanner appears only at count===1 and fires onAdd', () => {
    const onAdd = vi.fn();
    render(<FirstSaveBanner count={1} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: /Add another/ }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('GraphLockOverlay hides at activation', () => {
    const { container } = render(<GraphLockOverlay count={3} onAdd={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('ActivationToast renders when visible', () => {
    render(<ActivationToast visible onDone={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent(/graph is live/);
  });
});
