import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KeywordRulesPanel } from './KeywordRulesPanel.jsx';

describe('KeywordRulesPanel', () => {
  it('shows the empty state when no rules are present', () => {
    render(
      <KeywordRulesPanel
        rules={{ rules: [] }}
        onRulesChange={() => {}}
        onRescanVault={() => {}}
      />,
    );
    expect(screen.getByText('No rules yet.')).toBeInTheDocument();
  });

  it('lets the user add a new rule and emits onRulesChange', () => {
    const onRulesChange = vi.fn();
    render(
      <KeywordRulesPanel
        rules={{ rules: [] }}
        onRulesChange={onRulesChange}
        onRescanVault={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '+ Add your first rule' }));
    fireEvent.change(screen.getByLabelText('Tag'), { target: { value: 'deep work' } });
    fireEvent.change(screen.getByLabelText('Triggers'), { target: { value: 'focus, flow' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onRulesChange).toHaveBeenCalledWith({
      rules: [{ tag: 'deep work', triggers: ['focus', 'flow'], links: [] }],
    });
  });

  it('renders an existing rule row', () => {
    render(
      <KeywordRulesPanel
        rules={{ rules: [{ tag: 'product', triggers: ['ship'], links: [] }] }}
        onRulesChange={() => {}}
        onRescanVault={() => {}}
      />,
    );
    expect(screen.getByText('#product')).toBeInTheDocument();
    expect(screen.getByText('ship')).toBeInTheDocument();
  });
});
