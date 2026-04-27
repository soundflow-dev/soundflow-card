// styles.js - CSS partilhado para todos os componentes do SoundFlow

export const SOUNDFLOW_STYLES = `
  :host {
    --sf-grad: linear-gradient(135deg, #EA3572 0%, #C729C7 50%, #7B3FE4 100%);
    --sf-grad-soft: linear-gradient(135deg, rgba(234,53,114,0.12) 0%, rgba(199,41,199,0.12) 50%, rgba(123,63,228,0.12) 100%);
    --sf-pink: #EA3572;
    --sf-purple: #C729C7;
    --sf-violet: #7B3FE4;
    --sf-pink-soft: rgba(234,53,114,0.15);
    --sf-pink-border: rgba(234,53,114,0.3);
    --sf-pink-text: #FFA8C5;

    /* Tema adaptativo: usa as variáveis do HA */
    --sf-bg: var(--card-background-color, #1a1b22);
    --sf-card: var(--card-background-color, #1a1b22);
    --sf-card-2: var(--ha-card-background, var(--card-background-color, #25262e));
    --sf-text: var(--primary-text-color, #ffffff);
    --sf-text-2: var(--secondary-text-color, rgba(255,255,255,0.65));
    --sf-text-3: var(--disabled-text-color, rgba(255,255,255,0.4));
    --sf-border: var(--divider-color, rgba(255,255,255,0.08));
    --sf-overlay: rgba(0,0,0,0.5);
    --sf-button-bg: rgba(127,127,127,0.12);
    --sf-button-hover: rgba(127,127,127,0.2);
  }

  * {
    box-sizing: border-box;
  }

  button {
    font-family: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  button:focus-visible {
    outline: 2px solid var(--sf-pink);
    outline-offset: 2px;
  }

  .sf-icon-btn {
    border: none;
    background: transparent;
    color: var(--sf-text);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    line-height: 0;
    transition: background 0.15s, transform 0.1s;
  }

  .sf-icon-btn:active {
    transform: scale(0.95);
  }

  .sf-icon-btn:hover {
    background: var(--sf-button-hover);
  }

  .sf-icon-btn.sf-circle {
    border-radius: 50%;
    background: var(--sf-button-bg);
  }

  .sf-icon-btn.sf-grad {
    background: var(--sf-grad);
    color: white;
    box-shadow: 0 8px 24px -6px rgba(234,53,114,0.5);
  }

  .sf-icon-btn.sf-grad:hover {
    background: var(--sf-grad);
    filter: brightness(1.1);
  }

  .sf-icon-btn.sf-ghost {
    background: transparent;
    color: var(--sf-text-2);
  }

  .sf-icon-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .sf-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px 8px 11px;
    border-radius: 999px;
    background: var(--sf-pink-soft);
    border: 1px solid var(--sf-pink-border);
    color: var(--sf-text);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }

  .sf-pill:hover {
    background: rgba(234,53,114,0.22);
  }

  .sf-pill .sf-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--sf-pink);
    box-shadow: 0 0 8px var(--sf-pink);
  }

  .sf-pill svg {
    fill: currentColor;
  }

  /* Slider de progresso */
  .sf-progress {
    height: 3px;
    background: var(--sf-border);
    border-radius: 2px;
    overflow: hidden;
    cursor: pointer;
  }

  .sf-progress-fill {
    height: 100%;
    background: var(--sf-grad);
    border-radius: 2px;
    transition: width 0.3s;
  }

  /* Volume slider mini */
  .sf-vol-bar {
    height: 4px;
    background: var(--sf-border);
    border-radius: 2px;
    overflow: hidden;
    cursor: pointer;
  }

  .sf-vol-fill {
    height: 100%;
    background: var(--sf-grad);
    border-radius: 2px;
    transition: width 0.15s;
  }

  /* Botão "Igualar" */
  .sf-equalize {
    padding: 9px 14px;
    background: var(--sf-pink-soft);
    border: 1px solid var(--sf-pink-border);
    border-radius: 12px;
    color: var(--sf-pink-text);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
  }

  .sf-equalize:hover {
    background: rgba(234,53,114,0.22);
  }

  /* Checkbox quadrado para sincronizar coluna */
  .sf-speaker-check {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    transition: transform 0.1s;
  }
  .sf-speaker-check:hover {
    transform: scale(1.08);
  }

  /* Modal overlay */
  .sf-modal-overlay {
    position: fixed;
    inset: 0;
    background: var(--sf-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 9999;
    backdrop-filter: blur(8px);
    animation: sf-fade-in 0.2s ease;
  }

  @keyframes sf-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes sf-slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .sf-modal {
    background: var(--sf-card);
    border-radius: 24px;
    padding: 24px;
    width: 100%;
    max-width: 440px;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid var(--sf-border);
    color: var(--sf-text);
    animation: sf-slide-up 0.25s ease;
    position: relative;
  }

  .sf-popup {
    background: var(--sf-card);
    border-radius: 20px;
    padding: 22px;
    width: 100%;
    max-width: 480px;
    max-height: 80vh;
    overflow-y: auto;
    border: 1px solid var(--sf-border);
    color: var(--sf-text);
    animation: sf-slide-up 0.25s ease;
  }

  .sf-popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
  }

  .sf-popup-title {
    font-size: 16px;
    font-weight: 500;
  }

  /* List items */
  .sf-list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 12px;
    background: var(--sf-button-bg);
    border: 1px solid var(--sf-border);
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.15s;
    color: var(--sf-text);
  }

  .sf-list-item:hover {
    background: var(--sf-button-hover);
  }

  .sf-list-item.sf-active {
    background: var(--sf-pink-soft);
    border-color: var(--sf-pink-border);
  }

  .sf-list-item.sf-disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .sf-list-item.sf-disabled:hover {
    background: var(--sf-button-bg);
  }

  .sf-list-item-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .sf-list-item-content {
    flex: 1;
    min-width: 0;
  }

  .sf-list-item-title {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sf-list-item-subtitle {
    font-size: 11px;
    color: var(--sf-text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Loader */
  .sf-loader {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: var(--sf-text-3);
    font-size: 13px;
  }

  .sf-empty {
    text-align: center;
    padding: 30px 20px;
    color: var(--sf-text-3);
    font-size: 13px;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: var(--sf-border);
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--sf-text-3);
  }
`;

// Logo SVG embedded
export const SOUNDFLOW_LOGO_SVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sflogo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EA3572"/>
      <stop offset="50%" stop-color="#C729C7"/>
      <stop offset="100%" stop-color="#7B3FE4"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#sflogo-bg)"/>
  <path d="M 22 56 Q 36 36, 50 50 T 78 46" fill="none" stroke="white" stroke-width="4.5" stroke-linecap="round" opacity="0.95"/>
  <circle cx="22" cy="56" r="4" fill="white"/>
  <circle cx="78" cy="46" r="4" fill="white"/>
</svg>
`;

// Common SVG paths used across the card
export const ICONS = {
  play: '<path d="M8 5v14l11-7z"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  prev: '<path d="M6 6h2.5v12H6zM10 12l9 6V6z"/>',
  next: '<path d="M5 6l9 6-9 6V6zM15.5 6H18v12h-2.5z"/>',
  shuffle:
    '<polyline points="16 3 21 3 21 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><line x1="4" y1="20" x2="21" y2="3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><polyline points="21 16 21 21 16 21" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><line x1="15" y1="15" x2="21" y2="21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><line x1="4" y1="4" x2="9" y2="9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  repeat:
    '<polyline points="17 1 21 5 17 9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 11V9a4 4 0 014-4h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><polyline points="7 23 3 19 7 15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 13v2a4 4 0 01-4 4H3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  minus:
    '<path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  plus:
    '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  mute:
    '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  volume:
    '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  search:
    '<circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" stroke-width="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  settings:
    '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" fill="none" stroke="currentColor" stroke-width="2"/>',
  close:
    '<line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  back:
    '<polyline points="15 18 9 12 15 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  chevron_right:
    '<path d="M9 6l6 6-6 6z" fill="currentColor"/>',
  chevron_down: '<path d="M7 10l5 5 5-5z" fill="currentColor"/>',
  check:
    '<polyline points="20 6 9 17 4 12" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  star:
    '<polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8" fill="currentColor"/>',
  speaker:
    '<path d="M11 5L6 9H2v6h4l5 4V5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  music_note:
    '<path d="M9 18V5l12-2v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" fill="currentColor"/><circle cx="18" cy="16" r="3" fill="currentColor"/>',
  playlist:
    '<line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  shuffle_play:
    '<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M9.5 8.5l6 3.5-6 3.5z" fill="white"/>',
};

export function svg(name, size = 24, color = 'currentColor') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}">${ICONS[name] || ''}</svg>`;
}
