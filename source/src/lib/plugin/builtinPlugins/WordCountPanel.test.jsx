import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWordCountPanel } from './WordCountPanel.jsx';

describe('WordCountPanel', () => {
  it('renders the header even when entries are empty', () => {
    render(renderWordCountPanel({ entries: [] }));
    expect(screen.getByText('Word Count')).toBeInTheDocument();
  });

  it('renders total words for given entries', () => {
    const entries = [
      { id: 'a', type: 'note', notes: 'one two three' },
      { id: 'b', type: 'note', notes: 'four five' },
    ];
    render(renderWordCountPanel({ entries }));
    expect(screen.getByText(/words/)).toBeInTheDocument();
  });
});
