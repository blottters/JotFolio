// "Word Count" example plugin — fulfills SlateVault Phase 8's
// requirement for a working sample. Demonstrates both extension
// points: a registered command and a registered sidebar panel.
//
// Talks to the host only through the frozen appContext (registerCommand,
// registerPanel, toast, getEntries). Never imports App internals.

import { wordCountSummary } from './wordCountStats.js';
import { renderWordCountPanel } from './WordCountPanel.jsx';

export const wordCountPlugin = {
  id: 'wordcount',
  name: 'Word Count',
  activate(ctx) {
    ctx.registerCommand({
      id: 'total',
      name: 'Word Count: total across vault',
      hint: 'Toast the total word count for all entries',
      keywords: ['count', 'words', 'stats'],
      run: () => {
        const summary = wordCountSummary(ctx.getEntries());
        ctx.toast(`Vault: ${summary.totalWords.toLocaleString('en-US')} words across ${summary.entryCount} entries`, 'info');
      },
    });
    ctx.registerPanel({
      id: 'panel',
      label: 'Word Count',
      render: ({ entries }) => renderWordCountPanel({ entries }),
    });
  },
  deactivate() {
    // Nothing to clean up — host disposers handle command + panel removal.
  },
};
