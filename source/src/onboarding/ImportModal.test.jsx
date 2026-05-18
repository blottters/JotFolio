import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ImportModal } from './ImportModal.jsx';

const source = {
  label: 'CSV',
  icon: '📊',
  help: 'Pick a file to import',
  accept: '.csv',
  inputType: 'file',
  parse: async () => [{ id: '1', title: 'Imported' }],
};

describe('ImportModal', () => {
  it('renders the source header and help text', () => {
    render(<ImportModal source={source} onClose={() => {}} onComplete={() => {}} />);
    expect(screen.getByText('Import from CSV')).toBeInTheDocument();
    expect(screen.getByText('Pick a file to import')).toBeInTheDocument();
  });

  it('closes via the backdrop click', () => {
    const onClose = vi.fn();
    render(<ImportModal source={source} onClose={onClose} onComplete={() => {}} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalled();
  });
});
