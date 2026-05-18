import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TagSuggestions } from './TagSuggestions.jsx';

describe('TagSuggestions', () => {
  it('returns null when no suggestions remain', () => {
    const { container } = render(
      <TagSuggestions value="a, b" allTags={['a', 'b']} onChange={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('appends a suggested tag to the value on click', () => {
    const onChange = vi.fn();
    render(<TagSuggestions value="a" allTags={['a', 'b']} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'b' }));
    expect(onChange).toHaveBeenCalledWith('a, b');
  });
});
