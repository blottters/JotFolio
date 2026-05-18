import { describe, expect, it, vi, beforeEach, afterAll } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Module = require('module');

const buildFromTemplate = vi.fn((template) => ({ __template: template, kind: 'Menu' }));
const openExternal = vi.fn();
const electronStub = {
  Menu: { buildFromTemplate },
  app: { getVersion: () => '0.0.0-test' },
  shell: { openExternal },
};

const origLoad = Module._load;
Module._load = function loadHook(request, parent, isMain) {
  if (request === 'electron') return electronStub;
  return origLoad.call(this, request, parent, isMain);
};

afterAll(() => {
  Module._load = origLoad;
});

// Now safe to require menus.js
const { buildMenu } = require('./menus.js');

beforeEach(() => {
  buildFromTemplate.mockClear();
  openExternal.mockClear();
});

describe('buildMenu', () => {
  it('returns the Menu object built from its template', () => {
    const fakeWin = { webContents: { send: vi.fn() } };
    const menu = buildMenu(fakeWin);
    expect(menu.kind).toBe('Menu');
    expect(Array.isArray(menu.__template)).toBe(true);
    expect(buildFromTemplate).toHaveBeenCalledTimes(1);
  });

  it('includes File, Edit, View, window, and help submenus', () => {
    const menu = buildMenu({ webContents: { send: vi.fn() } });
    const labelsOrRoles = menu.__template.map(m => m.label || m.role);
    expect(labelsOrRoles).toEqual(expect.arrayContaining(['File', 'Edit', 'View', 'window', 'help']));
  });

  it('File submenu wires click handlers that call win.webContents.send with menu:* channels', () => {
    const send = vi.fn();
    const menu = buildMenu({ webContents: { send } });
    const file = menu.__template.find(m => m.label === 'File');
    expect(file).toBeTruthy();
    const newNote = file.submenu.find(i => i.label === 'New Note');
    expect(newNote).toBeTruthy();
    expect(typeof newNote.click).toBe('function');
    newNote.click();
    expect(send).toHaveBeenCalledWith('menu:new-note');
  });

  it('Help submenu uses the safe external URL allowlist (https only)', () => {
    const menu = buildMenu({ webContents: { send: vi.fn() } });
    const help = menu.__template.find(m => m.role === 'help');
    expect(help).toBeTruthy();
    const helpItem = help.submenu.find(i => i.label === 'JotFolio Help');
    expect(helpItem).toBeTruthy();
    helpItem.click();
    expect(openExternal).toHaveBeenCalledWith('https://jotfolio.app/help');
  });
});
