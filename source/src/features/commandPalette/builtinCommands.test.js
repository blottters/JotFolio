import { describe, it, expect, vi } from 'vitest';
import { registerBuiltinCommands } from './builtinCommands.js';

function makeRegistry() {
  const cmds = [];
  return {
    cmds,
    register(c) {
      cmds.push(c);
      return () => {
        const i = cmds.indexOf(c);
        if (i >= 0) cmds.splice(i, 1);
      };
    },
  };
}

describe('registerBuiltinCommands', () => {
  it('registers all builtin commands and returns a dispose function', () => {
    const registry = makeRegistry();
    const dispose = registerBuiltinCommands(registry, {});
    expect(registry.cmds.length).toBeGreaterThanOrEqual(10);
    // sanity: known ids present
    const ids = registry.cmds.map(c => c.id);
    expect(ids).toContain('core:create-note');
    expect(ids).toContain('core:toggle-theme');
    expect(typeof dispose).toBe('function');
    dispose();
    expect(registry.cmds.length).toBe(0);
  });

  it('wires command.run into appCtx callbacks (or no-ops if missing)', () => {
    const registry = makeRegistry();
    const openAdd = vi.fn();
    const toggleTheme = vi.fn();
    registerBuiltinCommands(registry, { openAdd, toggleTheme });
    const createNote = registry.cmds.find(c => c.id === 'core:create-note');
    createNote.run();
    expect(openAdd).toHaveBeenCalledWith({ type: 'note' });

    const themeCmd = registry.cmds.find(c => c.id === 'core:toggle-theme');
    themeCmd.run();
    expect(toggleTheme).toHaveBeenCalled();

    // Edge: missing callback shouldn't throw
    const randomCmd = registry.cmds.find(c => c.id === 'core:random-note');
    expect(() => randomCmd.run()).not.toThrow();
  });
});
