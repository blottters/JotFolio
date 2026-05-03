// Application menu per wireframe 12. Built on app ready.
// Dynamic plugin commands added in Phase 4.

const { Menu, app, shell } = require('electron');

const isMac = process.platform === 'darwin';
const mod = isMac ? 'Cmd' : 'Ctrl';

function buildMenu(win) {
  const send = (channel) => () => win?.webContents.send(channel);

  const template = [
    ...(isMac ? [{
      label: 'JotFolio',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { label: 'Preferences…', accelerator: `${mod}+,`, click: send('menu:preferences') },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New Note', accelerator: `${mod}+N`, click: send('menu:new-note') },
        { label: 'Quick Capture', accelerator: `Shift+${mod}+N`, click: send('menu:quick-capture') },
        { type: 'separator' },
        { label: 'Open Vault…', accelerator: `${mod}+Shift+O`, click: send('menu:open-vault') },
        { type: 'separator' },
        { label: 'Close Window', accelerator: `${mod}+W`, role: 'close' },
        ...(isMac ? [] : [{ type: 'separator' }, { role: 'quit' }]),
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
        { type: 'separator' },
        { label: 'Find in Vault', accelerator: `${mod}+Shift+F`, click: send('menu:find-in-vault') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Sidebar', accelerator: `${mod}+\\`, click: send('menu:toggle-sidebar') },
        { label: 'Toggle Detail', accelerator: `${mod}+Shift+\\`, click: send('menu:toggle-detail') },
        { type: 'separator' },
        { label: 'Command Palette', accelerator: `${mod}+P`, click: send('menu:command-palette') },
        { label: 'Quick Switcher', accelerator: `${mod}+O`, click: send('menu:quick-switcher') },
        { type: 'separator' },
        { label: 'Constellation', accelerator: `${mod}+G`, click: send('menu:graph') },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [{ type: 'separator' }, { role: 'front' }] : [{ role: 'close' }]),
      ],
    },
    {
      role: 'help',
      submenu: [
        { label: 'JotFolio Help', click: () => shell.openExternal('https://jotfolio.app/help') },
        { label: 'Report an Issue', click: () => shell.openExternal('https://github.com/anthropics/jotfolio/issues') },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

module.exports = { buildMenu };
