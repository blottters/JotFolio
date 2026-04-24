import { resolveThemeVars } from './resolve.js';

// Extract default colors from any theme for customization
export function getThemeDefaults(themeKey,isDark){
  const {vars}=resolveThemeVars({theme:themeKey,darkMode:isDark?'dark':'light'});
  return{bg:vars['--bg']||'#ffffff',fg:vars['--tx']||'#000000',ac:vars['--ac']||'#000000',b2:vars['--b2']||vars['--bg']||'#eeeeee'};
}
