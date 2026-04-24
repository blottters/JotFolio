import { THEMES } from './themes.js';

// Extract default colors from any theme for customization
export function getThemeDefaults(themeKey,isDark){
  const t=THEMES[themeKey];
  if(!t)return{bg:'#ffffff',fg:'#000000',ac:'#000000'};
  const vars={...t.light,...(isDark?t.dark:{})};
  return{bg:vars['--bg']||'#ffffff',fg:vars['--tx']||'#000000',ac:vars['--ac']||'#000000',b2:vars['--b2']||vars['--bg']||'#eeeeee'};
}
