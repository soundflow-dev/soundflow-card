export function isDark(hass) {
  if (typeof hass?.themes?.darkMode === 'boolean') return hass.themes.darkMode;
  if (typeof hass?.selectedTheme?.dark === 'boolean') return hass.selectedTheme.dark;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return true;
}

export function themeVars(dark) {
  if (dark) {
    return {
      '--sf-bg': '#0e0a14',
      '--sf-surface': '#1a1320',
      '--sf-surface-2': '#241a2c',
      '--sf-border': 'rgba(255,255,255,0.08)',
      '--sf-text': '#f5f0fa',
      '--sf-text-dim': 'rgba(245,240,250,0.62)',
      '--sf-text-mute': 'rgba(245,240,250,0.42)',
      '--sf-track': 'rgba(255,255,255,0.10)',
      '--sf-shadow': '0 8px 32px rgba(0,0,0,0.55)',
      '--sf-overlay': 'rgba(8,5,12,0.78)'
    };
  }
  return {
    '--sf-bg': '#f7f3fb',
    '--sf-surface': '#ffffff',
    '--sf-surface-2': '#f1eaf6',
    '--sf-border': 'rgba(20,10,30,0.10)',
    '--sf-text': '#1a1320',
    '--sf-text-dim': 'rgba(26,19,32,0.65)',
    '--sf-text-mute': 'rgba(26,19,32,0.42)',
    '--sf-track': 'rgba(20,10,30,0.10)',
    '--sf-shadow': '0 8px 32px rgba(60,30,90,0.18)',
    '--sf-overlay': 'rgba(20,10,30,0.45)'
  };
}

export function applyTheme(root, hass) {
  const dark = isDark(hass);
  const vars = themeVars(dark);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.dataset.theme = dark ? 'dark' : 'light';
}
