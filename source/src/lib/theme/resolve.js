import { THEMES } from './themes.js';
import { deriveVictoryTheme } from './victoryTheme.js';

export function resolveColorScheme(darkMode, systemDark) {
  if (darkMode === 'dark') return 'dark';
  if (darkMode === 'light') return 'light';
  return systemDark ? 'dark' : 'light';
}

export function resolveThemeVars({ theme, darkMode = 'system', systemDark = false, customColors = {}, fontFamily = '' }) {
  const safeTheme = THEMES[theme] ? theme : 'minimal';
  const scheme = resolveColorScheme(darkMode, systemDark);
  const t = THEMES[safeTheme];
  let vars = { ...t.light, ...(scheme === 'dark' ? t.dark : {}) };
  const cc = customColors[safeTheme];
  if (cc) {
    const derived = deriveVictoryTheme(cc.bg, cc.fg, cc.ac, cc.b2);
    derived['--fn'] = vars['--fn'] || derived['--fn'];
    derived['--rd'] = vars['--rd'] || derived['--rd'];
    vars = { ...vars, ...derived };
  }
  if (fontFamily) vars['--fn'] = fontFamily;
  return { safeTheme, scheme, vars };
}

export function assertThemeModePairs() {
  return Object.entries(THEMES).filter(([, theme]) => !theme.light || !theme.dark).map(([key]) => key);
}
