/* SoundFlow Card v1.0.10 - https://github.com/soundflow-dev/soundflow-card */
(function(){
"use strict";
/* === src/styles.js === */
const SF_GRADIENT = 'linear-gradient(135deg, #EA3572 0%, #C729C7 50%, #7B3FE4 100%)';
const SF_GRADIENT_SOFT = 'linear-gradient(135deg, rgba(234,53,114,0.18) 0%, rgba(199,41,199,0.18) 50%, rgba(123,63,228,0.18) 100%)';
const CSS = `
:host {
  display: block;
  font-family: var(--ha-font-family-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
  color: var(--sf-text);
  -webkit-tap-highlight-color: transparent;
}

* { box-sizing: border-box; }

button { font: inherit; color: inherit; cursor: pointer; border: 0; background: none; padding: 0; }
button:focus-visible { outline: 2px solid #C729C7; outline-offset: 2px; border-radius: 8px; }

/* === MINI PLAYER === */
.sf-mini {
  position: relative;
  display: flex; align-items: center; gap: 14px;
  padding: 12px 14px;
  background: var(--sf-surface);
  border-radius: 18px;
  box-shadow: var(--sf-shadow);
  border: 1px solid var(--sf-border);
  cursor: pointer;
  transition: transform .15s ease, box-shadow .2s ease;
  overflow: hidden;
}
.sf-mini:active { transform: scale(0.99); }
.sf-mini::before {
  content: ''; position: absolute; inset: 0;
  background: ${SF_GRADIENT_SOFT}; opacity: 0; pointer-events: none;
  transition: opacity .25s ease;
}
.sf-mini[data-playing="1"]::before { opacity: 1; }
.sf-mini-cover {
  width: 56px; height: 56px; border-radius: 10px;
  background: var(--sf-surface-2) center/cover no-repeat;
  flex-shrink: 0;
  position: relative; z-index: 1;
}
.sf-mini-info { flex: 1 1 auto; min-width: 0; position: relative; z-index: 1; }
.sf-mini-title { font-size: 16px; font-weight: 600; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sf-mini-subtitle { font-size: 13px; color: var(--sf-text-dim); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
.sf-mini-pending { font-size: 11px; color: #EA3572; margin-top: 3px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sf-pending { animation: sfPulse 1.4s ease-in-out infinite; }
@keyframes sfPulse {
  0%, 100% { box-shadow: 0 4px 14px rgba(199, 41, 199, 0.45); }
  50% { box-shadow: 0 4px 20px rgba(234, 53, 114, 0.85); }
}
.sf-mini-controls { display: flex; gap: 6px; align-items: center; position: relative; z-index: 1; }

.sf-circle-btn {
  width: 44px; height: 44px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--sf-surface-2);
  transition: transform .12s ease, background .2s ease;
}
.sf-circle-btn:hover { background: var(--sf-track); }
.sf-circle-btn:active { transform: scale(0.94); }
.sf-circle-btn.sf-primary {
  background: ${SF_GRADIENT};
  box-shadow: 0 4px 14px rgba(199, 41, 199, 0.45);
}
.sf-circle-btn.sf-primary:hover { background: ${SF_GRADIENT}; filter: brightness(1.05); }
.sf-circle-btn svg { width: 22px; height: 22px; fill: var(--sf-text); }
.sf-circle-btn.sf-primary svg { fill: white; }

.sf-progress { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: var(--sf-track); }
.sf-progress > span { display: block; height: 100%; background: ${SF_GRADIENT}; transition: width .8s linear; }

/* === MODAL === */
.sf-modal-backdrop {
  position: fixed; inset: 0; background: var(--sf-overlay); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; animation: sfFade .18s ease;
}
@keyframes sfFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes sfRise { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }

.sf-modal {
  width: min(420px, 96vw); max-height: 92vh; overflow: auto;
  background: var(--sf-surface); border-radius: 26px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.55);
  border: 1px solid var(--sf-border);
  animation: sfRise .22s ease;
  padding: 16px;
  position: relative;
}
.sf-modal::-webkit-scrollbar { width: 8px; }
.sf-modal::-webkit-scrollbar-thumb { background: var(--sf-track); border-radius: 4px; }

.sf-modal-header { display: flex; align-items: center; justify-content: flex-end; margin-bottom: 4px; }
.sf-modal-header.sf-with-back { justify-content: space-between; }
.sf-modal-header h2 { font-size: 18px; font-weight: 700; margin: 0; flex: 1; padding: 0 8px; }

.sf-modal-cover {
  width: 200px; height: 200px; border-radius: 18px;
  background: var(--sf-surface-2) center/cover no-repeat;
  margin: 4px auto 14px;
  box-shadow: 0 12px 36px rgba(0,0,0,0.35);
}
.sf-modal-title { text-align: center; font-size: 18px; font-weight: 700; line-height: 1.25; padding: 0 12px; }
.sf-modal-artist { text-align: center; font-size: 14px; color: var(--sf-text-dim); margin-top: 4px; }

.sf-seek { display: flex; align-items: center; gap: 8px; margin: 14px 4px 6px; font-size: 11px; color: var(--sf-text-dim); }
.sf-seek-track { flex: 1; height: 4px; background: var(--sf-track); border-radius: 2px; overflow: hidden; }
.sf-seek-track > span { display: block; height: 100%; background: ${SF_GRADIENT}; }

.sf-transport { display: flex; align-items: center; justify-content: center; gap: 14px; margin: 6px 0 14px; }
.sf-transport .sf-circle-btn { width: 48px; height: 48px; }
.sf-transport .sf-play { width: 60px; height: 60px; }
.sf-transport .sf-play svg { width: 28px; height: 28px; }
.sf-transport .sf-icon-toggle[data-on="1"] svg { fill: #EA3572; }

.sf-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
.sf-pill {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  background: var(--sf-surface-2); border-radius: 14px; border: 1px solid var(--sf-border);
  text-align: left; min-width: 0;
}
.sf-pill:hover { background: var(--sf-track); }
.sf-pill .sf-pill-icon {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  background: ${SF_GRADIENT}; display: flex; align-items: center; justify-content: center;
}
.sf-pill .sf-pill-icon svg { width: 20px; height: 20px; fill: white; }
.sf-pill .sf-pill-label { font-size: 11px; color: var(--sf-text-dim); text-transform: uppercase; letter-spacing: .04em; }
.sf-pill .sf-pill-value { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.sf-search-row { display: flex; align-items: center; gap: 8px; margin: 4px 0 12px;
  background: var(--sf-surface-2); border: 1px solid var(--sf-border); border-radius: 14px; padding: 6px 6px 6px 14px;
}
.sf-search-row input {
  flex: 1; min-width: 0; background: transparent; border: 0; outline: 0;
  color: var(--sf-text); font: inherit; padding: 6px 0;
}
.sf-search-row input::placeholder { color: var(--sf-text-mute); }
.sf-search-btn {
  width: 36px; height: 36px; border-radius: 50%;
  background: ${SF_GRADIENT}; display: flex; align-items: center; justify-content: center;
}
.sf-search-btn svg { width: 18px; height: 18px; fill: white; }

.sf-volume-row { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
.sf-volume-row .sf-vol-btn { width: 36px; height: 36px; border-radius: 50%; background: var(--sf-surface-2); display: flex; align-items: center; justify-content: center; }
.sf-volume-row .sf-vol-btn svg { width: 18px; height: 18px; fill: var(--sf-text); }
.sf-volume-bar { flex: 1; height: 4px; background: var(--sf-track); border-radius: 2px; position: relative; cursor: pointer; }
.sf-volume-bar > span { display: block; height: 100%; background: ${SF_GRADIENT}; border-radius: 2px; }
.sf-volume-pct { font-size: 13px; font-weight: 600; min-width: 36px; text-align: right; }
.sf-mute { width: 36px; height: 36px; border-radius: 50%; background: var(--sf-surface-2); display: flex; align-items: center; justify-content: center; }
.sf-mute[data-muted="1"] { background: rgba(234,53,114,0.18); }
.sf-mute svg { width: 18px; height: 18px; fill: var(--sf-text); }

.sf-equalize {
  margin-top: 10px; width: 100%; padding: 10px;
  background: rgba(234,53,114,0.10); border: 1px solid rgba(234,53,114,0.25);
  border-radius: 12px; color: #EA3572; font-weight: 600; font-size: 13px;
}
.sf-equalize:hover { background: rgba(234,53,114,0.18); }

/* === LISTS (Source / Speakers / Browser) === */
.sf-list { display: flex; flex-direction: column; gap: 8px; }
.sf-list-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; border-radius: 14px;
  background: var(--sf-surface-2); border: 1px solid var(--sf-border);
  text-align: left;
}
.sf-list-item:hover { background: var(--sf-track); }
.sf-list-item .sf-li-icon { width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0; background: var(--sf-surface) center/cover no-repeat; display: flex; align-items: center; justify-content: center; }
.sf-list-item .sf-li-icon svg { display: block; }
.sf-list-item .sf-li-body { flex: 1; min-width: 0; }
.sf-list-item .sf-li-title { font-size: 15px; font-weight: 600; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sf-list-item .sf-li-sub { font-size: 13px; color: var(--sf-text-dim); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sf-list-item .sf-li-chev { color: var(--sf-text-mute); }
.sf-list-item .sf-li-chev svg { width: 18px; height: 18px; fill: currentColor; }

.sf-section-title { font-size: 11px; color: var(--sf-text-mute); text-transform: uppercase; letter-spacing: .08em; margin: 14px 4px 8px; }

.sf-select-all {
  width: 100%; padding: 12px; border-radius: 12px;
  background: var(--sf-surface-2); border: 1px solid var(--sf-border);
  text-align: center; font-weight: 600; margin-bottom: 12px;
}
.sf-select-all:hover { background: var(--sf-track); }

/* speaker rows with checkbox + per-speaker volume */
.sf-spk { background: var(--sf-surface-2); border: 2px solid transparent; border-radius: 14px; padding: 10px 12px; transition: border-color .15s ease, background .15s ease; cursor: pointer; position: relative; overflow: hidden; }
.sf-spk + .sf-spk { margin-top: 10px; }
.sf-spk:hover { background: var(--sf-track); }
.sf-spk[data-checked="1"] { border-color: rgba(234,53,114,0.85); background: rgba(234,53,114,0.14); }
.sf-spk[data-checked="1"]::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
  background: ${SF_GRADIENT};
}
.sf-spk-row { display: flex; align-items: center; gap: 12px; }
.sf-checkbox {
  width: 26px; height: 26px; border-radius: 8px;
  border: 2px solid rgba(255,255,255,0.55); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.06);
  transition: background .15s ease, border-color .15s ease;
}
[data-theme="light"] .sf-checkbox { border-color: rgba(0,0,0,0.45); background: rgba(0,0,0,0.04); }
.sf-checkbox[data-checked="1"] { background: ${SF_GRADIENT}; border-color: transparent; }
.sf-checkbox svg { width: 16px; height: 16px; fill: white; opacity: 0; }
.sf-checkbox[data-checked="1"] svg { opacity: 1; }
.sf-spk-icon { width: 36px; height: 36px; border-radius: 10px; background: ${SF_GRADIENT}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sf-spk-icon svg { width: 18px; height: 18px; fill: white; }
.sf-spk-body { flex: 1; min-width: 0; }
.sf-spk-name { font-size: 15px; font-weight: 600; }
.sf-spk-state { font-size: 12px; color: var(--sf-text-dim); }
.sf-spk-vol { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.sf-spk-vol .sf-vol-btn { width: 28px; height: 28px; border-radius: 50%; background: var(--sf-surface); display: flex; align-items: center; justify-content: center; }
.sf-spk-vol .sf-vol-btn svg { width: 14px; height: 14px; fill: var(--sf-text); }
.sf-spk-vol .sf-volume-bar { flex: 1; }
.sf-spk-vol .sf-volume-pct { font-size: 12px; min-width: 32px; }

.sf-empty { text-align: center; color: var(--sf-text-dim); padding: 28px 12px; font-size: 14px; }
.sf-loading { text-align: center; color: var(--sf-text-dim); padding: 28px 12px; font-size: 14px; }

/* details popup (drill-down de álbum/artista/playlist) */
.sf-detail-head { display: flex; gap: 14px; padding: 8px 4px 14px; }
.sf-detail-art {
  width: 96px; height: 96px; border-radius: 12px; background: var(--sf-track) center/cover no-repeat;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.sf-detail-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 6px; }
.sf-detail-title { font-size: 16px; font-weight: 700; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.sf-detail-sub { font-size: 13px; color: var(--sf-text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sf-btn-primary {
  display: inline-flex; align-items: center; gap: 6px; align-self: flex-start;
  background: ${SF_GRADIENT}; color: white; border: 0; border-radius: 18px;
  padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 4px;
}
.sf-btn-primary:hover { filter: brightness(1.05); }
.sf-btn-primary:active { transform: scale(0.97); }
.sf-btn-primary svg { fill: white; }
.sf-li-idx {
  font-size: 13px; color: var(--sf-text-dim); font-variant-numeric: tabular-nums;
  display: inline-flex; align-items: center; justify-content: center; width: 100%; height: 100%;
}

/* shimmer / spinner */
.sf-spinner { width: 18px; height: 18px; border: 2px solid var(--sf-track); border-top-color: #C729C7; border-radius: 50%; animation: sfSpin .8s linear infinite; display: inline-block; vertical-align: middle; }
@keyframes sfSpin { to { transform: rotate(360deg); } }

.sf-toast {
  position: absolute; left: 50%; bottom: 20px; transform: translateX(-50%);
  background: rgba(0,0,0,0.85); color: white; padding: 8px 14px; border-radius: 10px; font-size: 13px;
  animation: sfRise .2s ease;
}

/* === EDITOR === */
.sf-editor { display: flex; flex-direction: column; gap: 14px; padding: 14px; }
.sf-editor label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.sf-editor input[type=text], .sf-editor input[type=number], .sf-editor select {
  background: var(--sf-surface-2); border: 1px solid var(--sf-border); color: var(--sf-text);
  padding: 8px 10px; border-radius: 8px; font: inherit;
}
.sf-editor .sf-editor-help { font-size: 11px; color: var(--sf-text-dim); }
.sf-editor .sf-checkrow { display: flex; align-items: center; gap: 8px; }
.sf-editor h4 { margin: 6px 0 0; font-size: 13px; font-weight: 600; }
.sf-editor .sf-pl { display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: var(--sf-surface-2); border-radius: 8px; }
.sf-editor .sf-pl + .sf-pl { margin-top: 4px; }
.sf-editor .sf-pl input[type=checkbox] { margin: 0; }

.sf-action-cols { display: flex; gap: 8px; align-items: center; padding: 10px; background: var(--sf-surface-2); border-radius: 10px; margin-top: 6px; }
.sf-action-cols button { padding: 6px 10px; border-radius: 6px; background: ${SF_GRADIENT}; color: white; font-weight: 600; }
`;

/* === src/icons.js === */
// SVG paths centralizados.
const ICONS = {
  play: 'M8 5v14l11-7z',
  pause: 'M6 4h4v16H6zm8 0h4v16h-4z',
  prev: 'M6 6h2v12H6zm3.5 6 8.5 6V6z',
  next: 'M16 6h2v12h-2zM6 6v12l8.5-6z',
  shuffle: 'M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z',
  repeat: 'M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z',
  repeat_one: 'M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2zM13 15V9h-1l-2 1v1h1.5v4z',
  search: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14',
  close: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z',
  chev: 'M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z',
  chev_down: 'M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z',
  vol_high: 'M3 9v6h4l5 5V4L7 9zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06A7 7 0 0 1 19 12a7 7 0 0 1-5 6.71v2.06A9 9 0 0 0 21 12c0-4.5-3.4-8.2-7-8.77z',
  vol_off: 'M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45a4.5 4.5 0 0 0 .05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.95 8.95 0 0 0 21 12a9 9 0 0 0-7-8.77v2.06A7 7 0 0 1 19 12zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9zM12 4 9.91 6.09 12 8.18z',
  minus: 'M19 13H5v-2h14z',
  plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z',
  check: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  speaker: 'M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-5 18a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM9 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z',
  speaker_simple: 'M14 4 9 9H5v6h4l5 5V4z',
  music: 'M12 3v10.55A4 4 0 1 0 14 17V7h4V3z',
  radio: 'M3.24 6.15a3 3 0 0 0-2.24 2.9V19a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3H8.3l8.26-3.34-1.74-3-9.79 4 1.5 3.49zM7 17a2 2 0 1 1 .01-4.01A2 2 0 0 1 7 17zm14-9c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z',
  star: 'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  album: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zm0-5.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  artist: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.34 0-10 1.67-10 5v3h20v-3c0-3.33-6.66-5-10-5z',
  playlist: 'M14 10H3v2h11zm0-4H3v2h11zM3 16h7v-2H3zm11.5-2v6l5-3z',
  shuffle_play: 'M14.83 13.41 13.42 14.82l3.13 3.13L14.5 20H20v-5.5l-2.04 2.04zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4zM10.59 9.17 5.41 4 4 5.41l5.17 5.17z',
  refresh: 'M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z'
};
function svgIcon(name, size = 20, fill = 'currentColor') {
  const d = ICONS[name];
  if (!d) return '';
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path d="${d}" fill="${fill}"/></svg>`;
}

/* === src/i18n.js === */
const STRINGS = {
  pt: {
    card_name: 'SoundFlow Card',
    card_desc: 'Controla o Music Assistant a partir do dashboard',
    nothing_playing: 'Nada a tocar',
    choose_source: 'Escolher fonte',
    speakers: 'Colunas',
    none: 'Nenhuma',
    one_speaker: '1 coluna',
    n_speakers: '{n} colunas',
    select_all: 'Selecionar toda a casa',
    deselect_all: 'Desselecionar todas',
    tap_to_select: 'Toque numa coluna para a selecionar',
    inactive: 'Inativo',
    synced: 'sincronizado',
    leader: 'líder',
    equalize_volume: 'Igualar volume',
    search_placeholder: 'Pesquisar música, artista, álbum…',
    no_results: 'Sem resultados',
    searching: 'A pesquisar…',
    loading: 'A carregar…',
    play_shuffle: 'Tocar aleatório',
    play: 'Tocar',
    play_now: 'Tocar agora',
    add_queue: 'Adicionar à fila',
    favorites: 'Favoritos do Music Assistant',
    favorites_subtitle: 'Música marcada como favorita',
    radios: 'Rádios favoritas',
    radios_subtitle: 'Estações',
    playlists: 'Playlists',
    albums: 'Álbuns',
    artists: 'Artistas',
    tracks: 'Músicas',
    library: 'Biblioteca',
    all_tracks: 'Todas as músicas',
    all_tracks_subtitle: 'Toda a biblioteca em modo aleatório',
    n_items: '{n} items',
    one_item: '1 item',
    no_items: 'Sem items',
    back: 'Voltar',
    close: 'Fechar',
    settings: 'Definições',
    config_title: 'Configuração do cartão SoundFlow',
    tab_config: 'Configuração',
    tab_visibility: 'Visibilidade',
    tab_layout: 'Layout',
    card_title: 'Título do card',
    card_title_help: 'Aparece no topo do mini player. Deixa em branco para esconder.',
    default_player: 'Player por defeito',
    default_player_auto: 'Auto (último a tocar)',
    default_player_help: 'Player apresentado quando nenhum estiver a tocar.',
    equalize_pct: 'Volume "igualar" (%)',
    equalize_help: 'Valor do botão "Igualar volume". Default: 2%.',
    hide_radio_search: 'Esconder pesquisa em modo rádio',
    visible_players: 'Players visíveis',
    visible_players_help: 'Limita quais players do Music Assistant aparecem no card. Sem seleção = todos.',
    n_selected: '{n} selecionados',
    show_code_editor: 'Mostrar editor de código',
    save: 'Guardar',
    cancel: 'Cancelar',
    error_no_ma: 'Music Assistant não detetado. Confirma que a integração está instalada.',
    error_no_players: 'Sem players Music Assistant disponíveis.',
    radio_stations: 'Estações',
    select_provider: 'Selecionar fornecedor',
    no_providers: 'Sem fornecedores configurados no Music Assistant',
    volume_equalized: 'Volume igualado a {n}%',
    pending_pick_speakers: 'Selecciona uma coluna primeiro',
    pending_set: 'Pronto: carrega ▶ para tocar',
    pending_clear: 'Pendente cancelado',
    play_all: 'Tocar tudo',
    play_album: 'Tocar álbum',
    play_artist: 'Tocar tudo do artista',
    play_all_shuffle: 'Tocar tudo (aleatório)',
    album: 'Álbum',
    artist: 'Artista',
    playlist: 'Playlist'
  },
  en: {
    card_name: 'SoundFlow Card',
    card_desc: 'Control Music Assistant from your dashboard',
    nothing_playing: 'Nothing playing',
    choose_source: 'Choose source',
    speakers: 'Speakers',
    none: 'None',
    one_speaker: '1 speaker',
    n_speakers: '{n} speakers',
    select_all: 'Select whole house',
    deselect_all: 'Deselect all',
    tap_to_select: 'Tap a speaker to select it',
    inactive: 'Inactive',
    synced: 'synced',
    leader: 'leader',
    equalize_volume: 'Equalize volume',
    search_placeholder: 'Search song, artist, album…',
    no_results: 'No results',
    searching: 'Searching…',
    loading: 'Loading…',
    play_shuffle: 'Play shuffled',
    play: 'Play',
    play_now: 'Play now',
    add_queue: 'Add to queue',
    favorites: 'Music Assistant favorites',
    favorites_subtitle: 'Music marked as favorite',
    radios: 'Favorite radios',
    radios_subtitle: 'Stations',
    playlists: 'Playlists',
    albums: 'Albums',
    artists: 'Artists',
    tracks: 'Tracks',
    library: 'Library',
    all_tracks: 'All tracks',
    all_tracks_subtitle: 'Whole library shuffled',
    n_items: '{n} items',
    one_item: '1 item',
    no_items: 'No items',
    back: 'Back',
    close: 'Close',
    settings: 'Settings',
    config_title: 'SoundFlow card configuration',
    tab_config: 'Configuration',
    tab_visibility: 'Visibility',
    tab_layout: 'Layout',
    card_title: 'Card title',
    card_title_help: 'Shows on top of the mini player. Leave blank to hide.',
    default_player: 'Default player',
    default_player_auto: 'Auto (last played)',
    default_player_help: 'Player shown when none is active.',
    equalize_pct: '"Equalize" volume (%)',
    equalize_help: 'Value used by the Equalize button. Default: 2%.',
    hide_radio_search: 'Hide search bar in radio mode',
    visible_players: 'Visible players',
    visible_players_help: 'Restrict which Music Assistant players appear in the card. Empty = all.',
    n_selected: '{n} selected',
    show_code_editor: 'Show code editor',
    save: 'Save',
    cancel: 'Cancel',
    error_no_ma: 'Music Assistant not detected. Make sure the integration is installed.',
    error_no_players: 'No Music Assistant players available.',
    radio_stations: 'Stations',
    select_provider: 'Select provider',
    no_providers: 'No providers configured in Music Assistant',
    volume_equalized: 'Volume set to {n}%',
    pending_pick_speakers: 'Pick a speaker first',
    pending_set: 'Ready: tap ▶ to play',
    pending_clear: 'Pending cleared',
    play_all: 'Play all',
    play_album: 'Play album',
    play_artist: 'Play all by artist',
    play_all_shuffle: 'Play all (shuffle)',
    album: 'Album',
    artist: 'Artist',
    playlist: 'Playlist'
  }
};
function getLang(hass) {
  const lang = hass?.locale?.language || hass?.language || 'en';
  return lang.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}
function t(hass, key, vars) {
  const lang = getLang(hass);
  const dict = STRINGS[lang] || STRINGS.en;
  let s = dict[key] ?? STRINGS.en[key] ?? key;
  if (vars) {
    for (const k of Object.keys(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k]);
    }
  }
  return s;
}
function plural(hass, n, oneKey, manyKey) {
  return n === 1 ? t(hass, oneKey) : t(hass, manyKey, { n });
}

/* === src/theme.js === */
function isDark(hass) {
  if (typeof hass?.themes?.darkMode === 'boolean') return hass.themes.darkMode;
  if (typeof hass?.selectedTheme?.dark === 'boolean') return hass.selectedTheme.dark;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return true;
}
function themeVars(dark) {
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
function applyTheme(root, hass) {
  const dark = isDark(hass);
  const vars = themeVars(dark);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.dataset.theme = dark ? 'dark' : 'light';
}

/* === src/providers.js === */
// Cores e ícones por provider domain do Music Assistant.
// Os domains correspondem aos identificadores em https://github.com/music-assistant/server/tree/main/music_assistant/providers

const ICON_MUSIC = 'M12 3v10.55A4 4 0 1 0 14 17V7h4V3z';
const ICON_RADIO = 'M3.5 7h17v12h-17zM3.5 7l8.5-3 8.5 3M7 14a3 3 0 1 0 6 0';
const ICON_APPLE = 'M16.4 13.7c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.5 1.3 0 1.8-.8 3.3-.8 1.5 0 2 .8 3.3.8 1.4 0 2.3-1.2 3.1-2.4.9-1.4 1.3-2.7 1.4-2.8-.1-.1-2.6-1-2.8-3.2zM14.4 6.7c.7-.8 1.1-1.9 1-3-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.9 1.1 0 2.2-.6 2.9-1.4z';
const ICON_SPOTIFY = 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 14.5c-.2.3-.6.4-.9.2-2.5-1.5-5.6-1.9-9.3-1-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 4-.9 7.5-.5 10.3 1.2.3.2.4.6.2.9zm1.2-2.7c-.3.4-.8.5-1.2.3-2.8-1.7-7.1-2.2-10.4-1.2-.5.1-1-.1-1.1-.6-.1-.5.1-1 .6-1.1 3.8-1.2 8.5-.6 11.7 1.4.4.2.5.7.4 1.2zm.1-2.8C14.3 9 8.7 8.8 5.4 9.8c-.6.2-1.2-.2-1.4-.7-.2-.6.2-1.2.7-1.4 3.8-1.1 10-1 14.1 1.5.5.3.7 1 .4 1.5-.3.5-1 .7-1.5.4z';
const ICON_TIDAL = 'M12.012 3.992 8.008 7.996 4.004 3.992 0 7.996 4.004 12 8.008 7.996 12.012 12 8.008 16.004l4.004 4.004 4.004-4.004L12.024 12l4.004-4.004 3.984 4.004L24 7.996l-4.004-4.004-4.004 4.004z';
const ICON_QOBUZ = 'M12 2 2 7v10l10 5 10-5V7zM4 8.4l8 4 8-4M4 14l8 4 8-4';
const ICON_DEEZER = 'M3 18h2v3H3zm0-5h2v4H3zm0-5h2v4H3zm5 5h2v8H8zm0-5h2v4H8zm0-5h2v4H8zm5 5h2v8h-2zm0-5h2v4h-2zm5 0h2v13h-2z';
const ICON_YT = 'M21.6 7.2a2.5 2.5 0 0 0-1.7-1.8C18.3 5 12 5 12 5s-6.3 0-7.9.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8c.2 1 .9 1.6 1.7 1.8 1.6.4 7.9.4 7.9.4s6.3 0 7.9-.4a2.5 2.5 0 0 0 1.7-1.8C22 15.2 22 12 22 12s0-3.2-.4-4.8zM10 15V9l5 3z';
const ICON_TUNEIN = 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z';
const ICON_SOUNDCLOUD = 'M2 14a1 1 0 1 1 2 0v3a1 1 0 1 1-2 0zm3-2a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0zm3-2a1 1 0 1 1 2 0v7a1 1 0 1 1-2 0zm3-2a1 1 0 1 1 2 0v9a1 1 0 1 1-2 0zm4 0c0-.6.4-1 1-1 3 0 5 2 5 5s-2 5-5 5h-1z';
const ICON_PLEX = 'M11 2 5 12l6 10h2l-6-10 6-10zm6 0-6 10 6 10h2l-6-10 6-10z';
const ICON_JELLYFIN = 'M12 2 4 18h16zm0 4 5 10h-3l-2-4-2 4H7z';
const ICON_LIBRARY = 'M4 4h2v16H4zm3 0h2v16H7zm4 0h6l3 16h-6z';
const ICON_FOLDER = 'M3 6h6l2 2h10v11H3z';
const PROVIDERS = {
  apple_music: { name: 'Apple Music', icon: ICON_APPLE, gradient: ['#FA2D48', '#B026FF'] },
  spotify: { name: 'Spotify', icon: ICON_SPOTIFY, gradient: ['#1DB954', '#0F8C3F'] },
  tidal: { name: 'Tidal', icon: ICON_TIDAL, gradient: ['#000000', '#1F2937'] },
  qobuz: { name: 'Qobuz', icon: ICON_QOBUZ, gradient: ['#0070D9', '#003E7E'] },
  deezer: { name: 'Deezer', icon: ICON_DEEZER, gradient: ['#A238FF', '#5C1F9E'] },
  ytmusic: { name: 'YouTube Music', icon: ICON_YT, gradient: ['#FF0000', '#990000'] },
  youtube_music: { name: 'YouTube Music', icon: ICON_YT, gradient: ['#FF0000', '#990000'] },
  tunein: { name: 'TuneIn', icon: ICON_RADIO, gradient: ['#F08218', '#A55810'] },
  radiobrowser: { name: 'Radio Browser', icon: ICON_RADIO, gradient: ['#F08218', '#A55810'] },
  soundcloud: { name: 'SoundCloud', icon: ICON_SOUNDCLOUD, gradient: ['#FF7700', '#CC5500'] },
  plex: { name: 'Plex', icon: ICON_PLEX, gradient: ['#E5A00D', '#B07A00'] },
  jellyfin: { name: 'Jellyfin', icon: ICON_JELLYFIN, gradient: ['#7B3FE4', '#3F2880'] },
  subsonic: { name: 'Subsonic', icon: ICON_MUSIC, gradient: ['#C32127', '#7E1518'] },
  opensubsonic: { name: 'OpenSubsonic', icon: ICON_MUSIC, gradient: ['#C32127', '#7E1518'] },
  filesystem_local: { name: 'Local Files', icon: ICON_FOLDER, gradient: ['#5E5670', '#3A3445'] },
  filesystem_smb: { name: 'SMB Share', icon: ICON_FOLDER, gradient: ['#5E5670', '#3A3445'] },
  builtin: { name: 'Music Assistant', icon: ICON_MUSIC, gradient: ['#EA3572', '#7B3FE4'] },
  library: { name: 'Music Assistant', icon: ICON_LIBRARY, gradient: ['#EA3572', '#7B3FE4'] }
};

const SF_GRAD_FALLBACK = ['#EA3572', '#7B3FE4'];
function providerInfo(domain) {
  if (!domain) return { name: 'Music', icon: ICON_MUSIC, gradient: SF_GRAD_FALLBACK };
  const norm = String(domain).toLowerCase().replace(/-/g, '_');
  return PROVIDERS[norm] || { name: titleCase(domain), icon: ICON_MUSIC, gradient: SF_GRAD_FALLBACK };
}

function titleCase(s) {
  return String(s).replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
function providerSvg(domain, size = 28) {
  const { icon, gradient } = providerInfo(domain);
  const id = `g${Math.random().toString(36).slice(2, 8)}`;
  return `
    <svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${gradient[0]}"/>
          <stop offset="100%" stop-color="${gradient[1]}"/>
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#${id})"/>
      <path d="${icon}" fill="white" opacity="0.95" transform="scale(0.6) translate(8 8)"/>
    </svg>`;
}

/* === src/api/ma.js === */
// Music Assistant API — usa serviços do HA com return_response.
// Todas as funções devolvem dados ou null.

let _cachedEntryId = null;
let _cachedMassQueueEntryId = null;
let _cachedMusicProviders = null;
let _cachedMusicProvidersTs = 0;
async function getMusicAssistantEntryId(hass) {
  if (_cachedEntryId) return _cachedEntryId;
  // 1) Procurar na entity_registry
  try {
    const list = await hass.callWS({ type: 'config/entity_registry/list' });
    if (Array.isArray(list)) {
      for (const e of list) {
        if (e?.platform === 'music_assistant' && e?.config_entry_id) {
          _cachedEntryId = e.config_entry_id;
          return _cachedEntryId;
        }
      }
    }
  } catch (e) {}
  // 2) Pelos config entries directos (se admin)
  try {
    const entries = await hass.callWS({ type: 'config_entries/get', domain: 'music_assistant' });
    if (entries && entries.length) {
      _cachedEntryId = entries[0].entry_id;
      return _cachedEntryId;
    }
  } catch (e) {}
  return null;
}

// === MASS_QUEUE (custom integration droans/mass_queue, opcional) ===
// Usado para chamadas que o serviço music_assistant nativo não expõe (ex.: filtrar
// library tracks por provider). Se a integração não estiver instalada, todas as
// funções aqui devolvem null silenciosamente.
async function getMassQueueEntryId(hass) {
  if (_cachedMassQueueEntryId) return _cachedMassQueueEntryId;
  try {
    const entries = await hass.callWS({ type: 'config_entries/get', domain: 'mass_queue' });
    if (entries && entries.length) {
      _cachedMassQueueEntryId = entries[0].entry_id;
      return _cachedMassQueueEntryId;
    }
  } catch (e) {}
  return null;
}
async function massQueueSendCommand(hass, command, data = {}) {
  const entryId = await getMassQueueEntryId(hass);
  if (!entryId) return null;
  const payload = { config_entry_id: entryId, command, data };
  const r = await callServiceWithResponse(hass, 'mass_queue', 'send_command', payload);
  return r?.response ?? r;
}

// Lista de music providers activos no MA (Apple Music Bruno, Maria, tunein, etc.).
// Cache de 60s — providers raramente mudam.
async function getMusicProviders(hass) {
  if (_cachedMusicProviders && Date.now() - _cachedMusicProvidersTs < 60_000) {
    return _cachedMusicProviders;
  }
  const r = await massQueueSendCommand(hass, 'providers');
  if (!Array.isArray(r)) return [];
  const music = r.filter(p => p?.type === 'music' && p?.available);
  _cachedMusicProviders = music;
  _cachedMusicProvidersTs = Date.now();
  return music;
}

// Drill-down: tracks dum álbum / artista / playlist.
// `kind` ∈ {album, artist, playlist}. Devolve array normalizado de tracks com
// shape { uri, name, artist, album, image, duration, favorite } — pronto para UI.
async function getItemTracks(hass, kind, uri, page = 0) {
  const SERVICE = { album: 'get_album_tracks', artist: 'get_artist_tracks', playlist: 'get_playlist_tracks' }[kind];
  if (!SERVICE) return [];
  const entryId = await getMassQueueEntryId(hass);
  if (!entryId) return [];
  const data = { config_entry_id: entryId, uri, page };
  const r = await callServiceWithResponse(hass, 'mass_queue', SERVICE, data);
  const items = r?.tracks ?? r?.items ?? [];
  if (!Array.isArray(items)) return [];
  return items.map(it => ({
    uri: it.media_content_id || it.uri,
    name: it.media_title || it.name || it.title,
    artist: it.media_artist || it.artist || it.artists?.[0]?.name || '',
    album: it.media_album_name || it.album?.name || '',
    image: it.media_image || it.image || it.metadata?.images?.[0]?.path,
    duration: it.duration,
    favorite: !!it.favorite
  })).filter(t => t.uri);
}

// Lista tracks da biblioteca filtradas por provider (apple_music--XXX, builtin, etc.).
// Devolve [] se mass_queue não estiver instalado.
async function getLibraryTracksByProvider(hass, providerInstanceId, opts = {}) {
  const data = {
    provider: providerInstanceId,
    limit: Math.min(500, opts.limit || 200),
    offset: opts.offset || 0
  };
  if (opts.orderBy) data.order_by = opts.orderBy;
  const r = await massQueueSendCommand(hass, 'music/tracks/library_items', data);
  return Array.isArray(r) ? r : [];
}

// === PLAYERS ===
function listMassPlayers(hass) {
  const players = [];
  for (const id of Object.keys(hass.states || {})) {
    if (!id.startsWith('media_player.')) continue;
    const s = hass.states[id];
    const a = s?.attributes || {};
    if (a.app_id === 'music_assistant' || 'mass_player_type' in a || 'active_queue' in a) {
      players.push({ entity_id: id, state: s.state, attributes: a, name: a.friendly_name || id });
    }
  }
  players.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return players;
}

// === SERVICE-BASED (return_response) HELPERS ===

async function callServiceWithResponse(hass, domain, service, data, target) {
  // hass.callService supports returnResponse boolean as 6th arg (or via { return_response: true } in newer versions)
  // The proper way in modern HA: use callWS with execute_script.
  try {
    // Try newer signature: hass.callService(domain, service, data, target, false, true)
    const r = await hass.callService(domain, service, data, target, false, true);
    if (r && (r.response || r.service_response)) return r.response || r.service_response;
    if (r && typeof r === 'object') return r;
  } catch (e) {
    // Fallback: callWS with call_service + return_response
  }
  try {
    const msg = { type: 'call_service', domain, service, service_data: data || {}, return_response: true };
    if (target) msg.target = target;
    const r = await hass.callWS(msg);
    return r?.response ?? r?.service_response ?? r;
  } catch (e) { return null; }
}

// === LIBRARY ===

const KIND_TO_MA = {
  playlists: 'playlist',
  albums: 'album',
  artists: 'artist',
  tracks: 'track',
  radios: 'radio',
  radio: 'radio',
  podcasts: 'podcast',
  audiobooks: 'audiobook'
};
async function getLibrary(hass, _entryId, kind, opts = {}) {
  const entryId = _entryId || await getMusicAssistantEntryId(hass);
  if (!entryId) return [];
  const mediaType = KIND_TO_MA[kind] || kind;
  const data = {
    config_entry_id: entryId,
    media_type: mediaType,
    favorite: !!opts.favorite,
    limit: Math.min(500, opts.limit || 100),
    offset: opts.offset || 0
  };
  if (opts.search) data.search = opts.search;
  if (opts.orderBy) data.order_by = opts.orderBy;
  const r = await callServiceWithResponse(hass, 'music_assistant', 'get_library', data);
  const items = r?.items;
  return Array.isArray(items) ? items : [];
}

// === SEARCH ===
async function search(hass, _entryId, query, opts = {}) {
  const entryId = _entryId || await getMusicAssistantEntryId(hass);
  if (!entryId) return emptySearch();
  const data = {
    config_entry_id: entryId,
    name: query,
    limit: opts.limit || 20,
    library_only: !!opts.libraryOnly
  };
  if (opts.mediaTypes && opts.mediaTypes.length) data.media_type = opts.mediaTypes;
  const r = await callServiceWithResponse(hass, 'music_assistant', 'search', data);
  if (!r) return emptySearch();
  return {
    artists: r.artists || [],
    albums: r.albums || [],
    tracks: r.tracks || [],
    playlists: r.playlists || [],
    radios: r.radio || r.radios || [],
    audiobooks: r.audiobooks || [],
    podcasts: r.podcasts || []
  };
}
function emptySearch() { return { artists: [], albums: [], tracks: [], playlists: [], radios: [], audiobooks: [], podcasts: [] }; }

// === BROWSE (via media_player.browse_media) ===
async function browse(hass, entityId, contentId = null, contentType = null) {
  const data = {};
  if (contentId !== null) data.media_content_id = contentId;
  if (contentType) data.media_content_type = contentType;
  const r = await callServiceWithResponse(hass, 'media_player', 'browse_media', data, { entity_id: entityId });
  // r is { [entity_id]: result }
  if (!r) return null;
  const v = r[entityId] || Object.values(r)[0];
  return v || null;
}

// === PLAY ===
async function playMedia(hass, entityId, mediaId, opts = {}) {
  // Activar shuffle ANTES de play_media para que MA shuffle a queue ao formar
  if (opts.shuffle) {
    try { await hass.callService('media_player', 'shuffle_set', { shuffle: true }, { entity_id: entityId }); } catch (e) {}
  }
  const data = { media_id: mediaId };
  if (opts.mediaType) data.media_type = opts.mediaType;
  if (opts.enqueue) data.enqueue = opts.enqueue;
  if (opts.radioMode != null) data.radio_mode = opts.radioMode;
  if (opts.artist) data.artist = opts.artist;
  if (opts.album) data.album = opts.album;
  try {
    await hass.callService('music_assistant', 'play_media', data, { entity_id: entityId });
    return true;
  } catch (e) {
    try {
      await hass.callService('media_player', 'play_media', {
        media_content_id: Array.isArray(mediaId) ? mediaId[0] : mediaId,
        media_content_type: opts.mediaType || 'music',
        enqueue: opts.enqueue === 'add' ? 'add' : 'replace'
      }, { entity_id: entityId });
      return true;
    } catch (err) { return false; }
  }
}

// === PLAYBACK CONTROLS ===
async function setShuffle(hass, entityId, on) { try { await hass.callService('media_player', 'shuffle_set', { shuffle: !!on }, { entity_id: entityId }); } catch(e){} }
async function setRepeat(hass, entityId, mode) { try { await hass.callService('media_player', 'repeat_set', { repeat: mode }, { entity_id: entityId }); } catch(e){} }
async function play(hass, entityId)  { return hass.callService('media_player', 'media_play',  {}, { entity_id: entityId }); }
async function pause(hass, entityId) { return hass.callService('media_player', 'media_pause', {}, { entity_id: entityId }); }
async function next(hass, entityId)  { return hass.callService('media_player', 'media_next_track', {}, { entity_id: entityId }); }
async function prev(hass, entityId)  { return hass.callService('media_player', 'media_previous_track', {}, { entity_id: entityId }); }
async function setVolume(hass, entityId, level) { return hass.callService('media_player', 'volume_set', { volume_level: clamp01(level) }, { entity_id: entityId }); }
async function setMute(hass, entityId, mute)    { return hass.callService('media_player', 'volume_mute', { is_volume_muted: !!mute }, { entity_id: entityId }); }

// === GROUPING ===
async function joinPlayers(hass, leaderId, memberIds) {
  return hass.callService('media_player', 'join', { group_members: memberIds }, { entity_id: leaderId });
}
async function unjoin(hass, entityId) {
  try {
    return await hass.callService('media_player', 'unjoin', {}, { entity_id: entityId });
  } catch (e) {
    const msg = String(e?.message || e || '');
    // MA recusa unjoin se o player for membro estático dum grupo (ex.: "Casa Toda").
    // Não é falha do card — é configuração do MA. Não inundar consola com erro.
    if (/static member/i.test(msg)) {
      console.info(`SoundFlow: ${entityId} é membro estático dum grupo no MA — unjoin ignorado.`);
      return null;
    }
    throw e;
  }
}
async function transferQueue(hass, sourceId, destId, autoPlay = true) {
  try {
    await hass.callService('music_assistant', 'transfer_queue', { source_player: sourceId, auto_play: autoPlay }, { entity_id: destId });
    return true;
  } catch (e) { return false; }
}

// === Compat stubs (no-op to avoid breaking older callers) ===
async function getProviders() { return []; }
async function callWS(hass, type, payload = {}) { try { return await hass.callWS({ type, ...payload }); } catch (e) { return null; } }
async function safeWS(hass, type, payload = {}) { return callWS(hass, type, payload); }
async function callService(hass, domain, service, data = {}, target = {}) { return hass.callService(domain, service, data, target); }

// === Helpers ===

function clamp01(n) { return Math.max(0, Math.min(1, Number(n) || 0)); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* === src/api/state.js === */
// Estado derivado do HA: quem está a tocar, leader, membros, seleção activa.

const PLAYING_STATES = new Set(['playing', 'paused', 'on', 'buffering']);
function getPlayer(hass, entityId) {
  return hass?.states?.[entityId] || null;
}
function isPlaying(state) {
  return state?.state === 'playing';
}
function isActive(state) {
  return state && PLAYING_STATES.has(state.state);
}
function getGroupMembers(hass, entityId) {
  const s = getPlayer(hass, entityId);
  const list = s?.attributes?.group_members || [];
  return Array.isArray(list) ? list.filter(x => x !== entityId) : [];
}

// Devolve o leader actual do grupo onde `entityId` participa, ou null se não está em grupo.
function findLeader(hass, entityId, allMassPlayers) {
  // Se este player tem group_members → é leader (ou single)
  const me = getPlayer(hass, entityId);
  const myMembers = me?.attributes?.group_members || [];
  if (Array.isArray(myMembers) && myMembers.length > 0) {
    return entityId; // tem filhos → é leader
  }
  // Senão, procura em todos os players quem tem este na sua group_members
  for (const p of allMassPlayers || []) {
    if (p.entity_id === entityId) continue;
    const gm = p.attributes?.group_members || [];
    if (gm.includes(entityId)) return p.entity_id;
  }
  return null;
}

// Devolve { leader, members[] } para o grupo activo derivado do estado actual.
// Convenção HA: o primeiro elemento de `group_members` é sempre o líder do grupo.
// Iterar `allMassPlayers` por ordem (alfabética) e usar o próprio iterado como líder
// elegia mal a coluna (ex.: "Casa de Banho" antes de "Sala") — usar gm[0] respeita
// o coordinator real reportado pelo HA.
function getActiveGroup(hass, allMassPlayers) {
  const playing = (allMassPlayers || []).filter(p => isActive(hass.states[p.entity_id]));
  for (const p of playing) {
    const gm = p.attributes?.group_members || [];
    if (gm.length > 0) {
      const leader = gm[0];
      // members na ordem fornecida pelo HA (leader em primeiro, depois sync)
      return { leader, members: gm.slice() };
    }
  }
  // Se há um a tocar isolado, esse é o "grupo" de um só
  if (playing.length === 1) {
    return { leader: playing[0].entity_id, members: [playing[0].entity_id] };
  }
  // Caso vários toquem isolados, devolve o primeiro como pseudo-líder
  if (playing.length > 1) {
    return { leader: playing[0].entity_id, members: playing.map(p => p.entity_id) };
  }
  return null;
}

// Last-played player (mais recentemente activo) — para arranque do card.
function lastPlayedPlayer(hass, allMassPlayers) {
  let best = null, bestTs = 0;
  for (const p of allMassPlayers || []) {
    const s = hass.states[p.entity_id];
    if (!s) continue;
    const ts = Date.parse(s.last_changed || s.last_updated || 0) || 0;
    if (isActive(s) && ts > bestTs) { best = p.entity_id; bestTs = ts; }
  }
  if (best) return best;
  // Senão devolve o primeiro
  return allMassPlayers?.[0]?.entity_id || null;
}
function getMediaInfo(state) {
  const a = state?.attributes || {};
  return {
    title: a.media_title || a.media_content_id || '',
    artist: a.media_artist || a.media_album_artist || '',
    album: a.media_album_name || '',
    image: a.entity_picture || a.media_image_url || a.album_art || null,
    duration: Number(a.media_duration) || 0,
    position: Number(a.media_position) || 0,
    positionAt: a.media_position_updated_at ? Date.parse(a.media_position_updated_at) : Date.now(),
    shuffle: !!a.shuffle,
    repeat: a.repeat || 'off',
    muted: !!a.is_volume_muted,
    volume: Number(a.volume_level) || 0,
    contentType: a.media_content_type || ''
  };
}
function livePosition(info, state) {
  if (!info.duration) return 0;
  if (state?.state !== 'playing') return info.position || 0;
  const elapsed = (Date.now() - info.positionAt) / 1000;
  return Math.min(info.duration, (info.position || 0) + elapsed);
}
function pickRandomLeader(candidates) {
  if (!candidates || !candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
function formatTime(s) {
  s = Math.max(0, Math.floor(s || 0));
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${m}:${ss}`;
}

/* === src/ui/popup-speakers.js === */
function renderSpeakersPopup(card, container) {
  const hass = card._hass;
  const visible = card._visiblePlayers();
  const active = getActiveGroup(hass, card._allMassPlayers()) || { leader: null, members: [] };
  const selected = card._activeSelection();

  const allSelected = visible.length > 0 && visible.every(p => selected.includes(p.entity_id));

  const items = visible.map(p => speakerRow(card, p, selected, active));

  container.innerHTML = `
    <div class="sf-modal-header sf-with-back">
      <h2>${t(hass, 'speakers')}</h2>
      <button class="sf-circle-btn" data-act="close" aria-label="${t(hass, 'close')}">${svgIcon('close', 18)}</button>
    </div>
    <div class="sf-section-title">${t(hass, 'tap_to_select')}</div>
    <button class="sf-select-all" data-act="toggle-all">
      ${allSelected ? t(hass, 'deselect_all') : t(hass, 'select_all')}
    </button>
    <div class="sf-list" id="sf-spk-list">${items.join('')}</div>
    <button class="sf-equalize" data-act="equalize">${t(hass, 'equalize_volume')} → ${card._config.equalize_volume ?? 2}%</button>
  `;

  container.querySelector('[data-act="close"]').addEventListener('click', () => card._closeAllPopups());
  container.querySelector('[data-act="toggle-all"]').addEventListener('click', () => card._toggleAll(allSelected));
  container.querySelector('[data-act="equalize"]').addEventListener('click', () => card._equalizeVolume());

  container.querySelectorAll('.sf-spk').forEach(node => attachRowHandlers(card, node));
}

function speakerRow(card, p, selectedIds, active) {
  const hass = card._hass;
  const s = hass.states[p.entity_id];
  const a = s?.attributes || {};
  const checked = selectedIds.includes(p.entity_id);
  const isLeader = active.leader === p.entity_id && active.members.length > 1;
  const isMember = active.members.includes(p.entity_id) && !isLeader;
  const stateLabel = stateText(card, s, isLeader, isMember);
  const vol = Math.round((Number(a.volume_level) || 0) * 100);

  return `
    <div class="sf-spk" data-entity="${p.entity_id}" data-checked="${checked ? 1 : 0}">
      <div class="sf-spk-row" data-act="row-toggle">
        <button class="sf-checkbox" data-checked="${checked ? 1 : 0}" data-act="toggle" aria-label="select">${svgIcon('check', 14, 'white')}</button>
        <div class="sf-spk-icon">${svgIcon('speaker_simple', 18, 'white')}</div>
        <div class="sf-spk-body">
          <div class="sf-spk-name">${escapeHtml(p.name)}</div>
          <div class="sf-spk-state">${stateLabel}</div>
        </div>
      </div>
      <div class="sf-spk-vol" data-act="vol-zone">
        <button class="sf-vol-btn" data-act="vol-down">${svgIcon('minus', 14)}</button>
        <div class="sf-volume-bar" data-act="vol-bar"><span style="width:${vol}%"></span></div>
        <span class="sf-volume-pct">${vol}%</span>
        <button class="sf-vol-btn" data-act="vol-up">${svgIcon('plus', 14)}</button>
      </div>
    </div>`;
}

function stateText(card, s, isLeader, isMember) {
  const hass = card._hass;
  const playing = isPlaying(s);
  let label = playing ? '▶︎' : t(hass, 'inactive');
  if (isLeader) label += ' · ' + t(hass, 'leader');
  else if (isMember) label += ' · ' + t(hass, 'synced');
  return label;
}

function attachRowHandlers(card, node) {
  const id = node.dataset.entity;
  // Linha inteira (excepto vol-zone) → toggle
  node.querySelector('[data-act="row-toggle"]').addEventListener('click', () => card._toggleSpeaker(id));
  // Volume buttons param propagação para não togglar
  const vd = node.querySelector('[data-act="vol-down"]');
  const vu = node.querySelector('[data-act="vol-up"]');
  const vb = node.querySelector('[data-act="vol-bar"]');
  vd.addEventListener('click', (e) => { e.stopPropagation(); card._adjustVolume(id, -0.05); });
  vu.addEventListener('click', (e) => { e.stopPropagation(); card._adjustVolume(id, +0.05); });
  vb.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    card._setVolume(id, pct);
  });
}

function escapeHtml(s) { return String(s ?? '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c])); }

/* === src/ui/popup-source.js === */
const VIEW_ROOT = 'root';
const VIEW_FAVORITES = 'favorites';
const VIEW_LIBRARY = 'library';
const VIEW_LIST = 'list'; // listing of items inside a chosen kind
const VIEW_PROVIDER_TRACKS = 'provider_tracks'; // música → escolher provider
async function renderSourcePopup(card, container) {
  const state = card._sourceView || { view: VIEW_ROOT };
  card._sourceView = state;
  const hass = card._hass;

  container.innerHTML = `
    <div class="sf-modal-header sf-with-back">
      ${state.view !== VIEW_ROOT ? `<button class="sf-circle-btn" data-act="back">${svgIcon('back', 18)}</button>` : '<span></span>'}
      <h2>${headerTitle(card, state)}</h2>
      <button class="sf-circle-btn" data-act="close">${svgIcon('close', 18)}</button>
    </div>
    <div id="sf-src-body"><div class="sf-loading">${t(hass, 'loading')} <span class="sf-spinner"></span></div></div>
  `;
  container.querySelector('[data-act="close"]').addEventListener('click', () => card._closeAllPopups());
  const back = container.querySelector('[data-act="back"]');
  if (back) back.addEventListener('click', () => navigateBack(card, container));

  await renderBody(card, container, state);
}

function headerTitle(card, state) {
  const hass = card._hass;
  switch (state.view) {
    case VIEW_FAVORITES: return t(hass, 'favorites');
    case VIEW_LIBRARY: return t(hass, 'library');
    case VIEW_LIST: return state.label || '';
    case VIEW_PROVIDER_TRACKS: return t(hass, 'tracks');
    default: return t(hass, 'choose_source');
  }
}

function navigateBack(card, container) {
  const v = card._sourceView;
  if (!v) return;
  if (v.view === VIEW_LIST || v.view === VIEW_PROVIDER_TRACKS) {
    card._sourceView = { view: v.parentView || VIEW_ROOT };
  } else {
    card._sourceView = { view: VIEW_ROOT };
  }
  renderSourcePopup(card, container);
}

async function renderBody(card, container, state) {
  const body = container.querySelector('#sf-src-body');
  switch (state.view) {
    case VIEW_ROOT:      return renderRoot(card, body);
    case VIEW_FAVORITES: return renderCategoryList(card, body, { favorite: true, parentView: VIEW_FAVORITES });
    case VIEW_LIBRARY:   return renderCategoryList(card, body, { favorite: false, parentView: VIEW_LIBRARY });
    case VIEW_LIST:      return renderItemList(card, body, state);
    case VIEW_PROVIDER_TRACKS: return renderProviderTracks(card, body, state);
  }
}

async function renderRoot(card, body) {
  const hass = card._hass;
  body.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'sf-list';
  list.appendChild(rowItem({
    icon: providerSvg('tunein', 36),
    title: t(hass, 'radios'),
    sub: t(hass, 'radios_subtitle'),
    onClick: () => {
      card._sourceView = { view: VIEW_LIST, kind: 'radios', favorite: true, label: t(hass, 'radios'), parentView: VIEW_ROOT };
      renderSourcePopup(card, card._popupHost());
    }
  }));
  list.appendChild(rowItem({
    icon: providerSvg('builtin', 36),
    title: t(hass, 'favorites'),
    sub: t(hass, 'favorites_subtitle'),
    onClick: () => {
      card._sourceView = { view: VIEW_FAVORITES };
      renderSourcePopup(card, card._popupHost());
    }
  }));
  list.appendChild(rowItem({
    icon: providerSvg('apple_music', 36),
    title: t(hass, 'library'),
    sub: '',
    onClick: () => {
      card._sourceView = { view: VIEW_LIBRARY };
      renderSourcePopup(card, card._popupHost());
    }
  }));
  body.appendChild(list);
}

async function renderCategoryList(card, body, opts) {
  const hass = card._hass;
  const kinds = ['playlists', 'albums', 'artists', 'tracks'];
  const colors = ['apple_music', 'deezer', 'jellyfin', 'tunein'];
  body.innerHTML = `<div class="sf-list" id="sf-cat-list"></div>`;
  const list = body.querySelector('#sf-cat-list');

  // "All tracks shuffle" só faz sentido para a Biblioteca completa
  if (!opts.favorite) {
    list.appendChild(rowItem({
      icon: providerSvg('builtin', 36),
      title: t(hass, 'all_tracks'),
      sub: t(hass, 'all_tracks_subtitle'),
      onClick: () => card._playAllTracksShuffle(),
      iconRight: 'play'
    }));
  }

  kinds.forEach((k, i) => {
    const isTracksInLibrary = k === 'tracks' && !opts.favorite;
    const node = rowItem({
      icon: providerSvg(colors[i], 36),
      title: labelForKind(hass, k),
      sub: '',
      onClick: () => {
        if (isTracksInLibrary) {
          // Biblioteca > Músicas: em vez de listar todas, escolher por provedor
          card._sourceView = { view: VIEW_PROVIDER_TRACKS, parentView: opts.parentView };
        } else {
          card._sourceView = { view: VIEW_LIST, kind: k, favorite: opts.favorite, label: labelForKind(hass, k), parentView: opts.parentView };
        }
        renderSourcePopup(card, card._popupHost());
      }
    });
    list.appendChild(node);
  });
}

async function renderProviderTracks(card, body, state) {
  const hass = card._hass;
  body.innerHTML = `<div class="sf-loading">${t(hass, 'loading')} <span class="sf-spinner"></span></div>`;
  const providers = await getMusicProviders(hass);
  if (!providers || providers.length === 0) {
    body.innerHTML = `<div class="sf-empty">${t(hass, 'no_items')}</div>`;
    return;
  }
  body.innerHTML = `<div class="sf-list" id="sf-prov-list"></div>`;
  const list = body.querySelector('#sf-prov-list');
  // Stream providers em primeiro (apple_music, spotify, etc.), depois builtin/local
  providers.sort((a, b) => {
    const sa = a.is_streaming_provider ? 0 : 1;
    const sb = b.is_streaming_provider ? 0 : 1;
    if (sa !== sb) return sa - sb;
    return (a.name || '').localeCompare(b.name || '');
  });
  providers.forEach(p => {
    const display = providerDisplayName(p);
    list.appendChild(rowItem({
      icon: providerSvg(p.domain || 'builtin', 36),
      title: display,
      sub: t(hass, 'all_tracks_subtitle'),
      iconRight: 'play',
      onClick: () => card._playProviderTracksShuffle(p.instance_id, display)
    }));
  });
}

function providerDisplayName(p) {
  // Para apple_music o "name" do MA é o nome da conta (ex.: "Bruno", "Maria").
  // Prefixar com o domain humanizado para clareza ("Apple Music — Bruno").
  const domainPretty = ({
    apple_music: 'Apple Music',
    spotify: 'Spotify',
    tidal: 'Tidal',
    deezer: 'Deezer',
    qobuz: 'Qobuz',
    ytmusic: 'YT Music',
    builtin: 'Music Assistant',
    tunein: 'TuneIn'
  })[p.domain] || p.domain || 'Provider';
  const name = (p.name || '').trim();
  if (!name || name.toLowerCase() === domainPretty.toLowerCase()) return domainPretty;
  return `${domainPretty} — ${name}`;
}

async function renderItemList(card, body, state) {
  const hass = card._hass;
  body.innerHTML = `<div class="sf-loading">${t(hass, 'loading')} <span class="sf-spinner"></span></div>`;
  const items = await card._getLibrary(state.kind, { favorite: !!state.favorite, limit: 500 });
  if (!items || items.length === 0) {
    body.innerHTML = `<div class="sf-empty">${t(hass, 'no_items')}</div>`;
    return;
  }
  body.innerHTML = `<div class="sf-list" id="sf-items"></div>`;
  const list = body.querySelector('#sf-items');
  const mediaType = state.kind === 'radios' ? 'radio' : state.kind.slice(0, -1); // radios → radio, tracks → track
  const shuffleHint = state.kind === 'playlists' || state.kind === 'tracks';
  items.forEach(it => list.appendChild(mediaItem(card, it, { mediaType, shuffleHint })));
}

function labelForKind(hass, kind) {
  return ({
    playlists: t(hass, 'playlists'),
    albums: t(hass, 'albums'),
    artists: t(hass, 'artists'),
    tracks: t(hass, 'tracks'),
    radios: t(hass, 'radios')
  })[kind] || kind;
}

function rowItem({ icon, title, sub, onClick, iconRight }) {
  const div = document.createElement('button');
  div.className = 'sf-list-item';
  div.innerHTML = `
    <div class="sf-li-icon">${icon}</div>
    <div class="sf-li-body">
      <div class="sf-li-title">${escapeHtml(title || '')}</div>
      ${sub ? `<div class="sf-li-sub">${escapeHtml(sub)}</div>` : ''}
    </div>
    <div class="sf-li-chev">${svgIcon(iconRight || 'chev', 18)}</div>`;
  div.addEventListener('click', onClick);
  return div;
}

function mediaItem(card, it, opts = {}) {
  const div = document.createElement('button');
  div.className = 'sf-list-item';
  const img = it?.image || it?.thumbnail || it?.metadata?.image;
  const title = it.name || it.title || it.uri || '';
  const sub = it.artists?.[0]?.name || it.artist || it.album?.name || '';
  // album/artist/playlist → drill-down (chevron); track/radio → action directo (play)
  const isDrill = opts.mediaType === 'album' || opts.mediaType === 'artist' || opts.mediaType === 'playlist';
  const chev = isDrill ? 'chev' : 'play';
  div.innerHTML = `
    <div class="sf-li-icon" style="${img ? `background-image:url(${JSON.stringify(img).slice(1, -1)});` : ''}">${img ? '' : providerSvg('builtin', 30)}</div>
    <div class="sf-li-body">
      <div class="sf-li-title">${escapeHtml(title)}</div>
      ${sub ? `<div class="sf-li-sub">${escapeHtml(sub)}</div>` : ''}
    </div>
    <div class="sf-li-chev">${svgIcon(chev, 18)}</div>`;
  div.addEventListener('click', () => {
    if (isDrill && it?.uri) card._openMediaDetails(it, opts.mediaType);
    else card._playMediaItem(it, opts);
  });
  return div;
}

function escapeHtml(s) { return String(s ?? '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c])); }

/* === src/ui/popup-search.js === */
function renderSearchResults(card, container, results) {
  const hass = card._hass;
  const sections = [
    { key: 'tracks',    label: t(hass, 'tracks') },
    { key: 'albums',    label: t(hass, 'albums') },
    { key: 'artists',   label: t(hass, 'artists') },
    { key: 'playlists', label: t(hass, 'playlists') },
    { key: 'radios',    label: t(hass, 'radios') }
  ];
  let html = `
    <div class="sf-modal-header sf-with-back">
      <button class="sf-circle-btn" data-act="back">${svgIcon('back', 18)}</button>
      <h2>${escapeHtml(results._query || '')}</h2>
      <button class="sf-circle-btn" data-act="close">${svgIcon('close', 18)}</button>
    </div>`;

  let any = false;
  for (const s of sections) {
    const items = results[s.key] || [];
    if (!items.length) continue;
    any = true;
    html += `<div class="sf-section-title">${s.label}</div><div class="sf-list" data-sec="${s.key}">`;
    for (const it of items.slice(0, 25)) {
      html += searchItemHtml(it, s.key);
    }
    html += `</div>`;
  }
  if (!any) html += `<div class="sf-empty">${t(hass, 'no_results')}</div>`;

  container.innerHTML = html;
  container.querySelector('[data-act="close"]').addEventListener('click', () => card._closeAllPopups());
  container.querySelector('[data-act="back"]').addEventListener('click', () => card._renderModal());

  // Drill-down vs play directo:
  //  - tracks/radios → click = tocar imediato
  //  - albums/artists/playlists → click = abrir details (escolher track ou Play all)
  const DRILLDOWN = new Set(['albums', 'artists', 'playlists']);
  for (const s of sections) {
    const sec = container.querySelector(`[data-sec="${s.key}"]`);
    if (!sec) continue;
    const items = results[s.key] || [];
    [...sec.querySelectorAll('.sf-list-item')].forEach((node, idx) => {
      const it = items[idx];
      const mediaType = s.key.slice(0, -1); // tracks → track
      node.addEventListener('click', () => {
        if (DRILLDOWN.has(s.key) && it?.uri) card._openMediaDetails(it, mediaType);
        else card._playMediaItem(it, { mediaType });
      });
    });
  }
}

function searchItemHtml(it, kind) {
  const img = it?.image || it?.metadata?.image || it?.images?.[0]?.path;
  const title = it.name || it.title || it.uri || '';
  const sub = it.artist || it.artists?.[0]?.name || it.album?.name || it.subtitle || '';
  // Chevron para drill-down (album/artist/playlist), play para action imediato (track/radio)
  const isDrill = kind === 'albums' || kind === 'artists' || kind === 'playlists';
  const chev = isDrill ? 'chev' : 'play';
  return `
    <button class="sf-list-item">
      <div class="sf-li-icon" style="${img ? `background-image:url(${JSON.stringify(img).slice(1, -1)});` : ''}">${img ? '' : providerSvg(it.provider || 'builtin', 30)}</div>
      <div class="sf-li-body">
        <div class="sf-li-title">${escapeHtml(title)}</div>
        ${sub ? `<div class="sf-li-sub">${escapeHtml(sub)}</div>` : ''}
      </div>
      <div class="sf-li-chev">${svgIcon(chev, 18)}</div>
    </button>`;
}

function escapeHtml(s) { return String(s ?? '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c])); }

/* === src/ui/popup-details.js === */
// Drill-down popup: mostra header dum álbum/artista/playlist + lista das suas tracks.
// `card._detailsView` = { kind: 'album'|'artist'|'playlist', item: {...} }
async function renderDetailsPopup(card, container) {
  const v = card._detailsView;
  if (!v || !v.item) { container.innerHTML = ''; return; }
  const hass = card._hass;
  const { kind, item } = v;
  const title = item.name || item.title || item.uri || '';
  const sub = item.artists?.[0]?.name || item.artist || subForKind(kind, hass);
  const img = item.image || item.metadata?.image || item.images?.[0]?.path || item.metadata?.images?.[0]?.path;
  const playAllLabel = playAllLabelForKind(hass, kind);

  container.innerHTML = `
    <div class="sf-modal-header sf-with-back">
      <button class="sf-circle-btn" data-act="back">${svgIcon('back', 18)}</button>
      <h2>${escapeHtml(title)}</h2>
      <button class="sf-circle-btn" data-act="close">${svgIcon('close', 18)}</button>
    </div>
    <div class="sf-detail-head">
      <div class="sf-detail-art" style="${img ? `background-image:url(${JSON.stringify(img).slice(1, -1)});` : ''}">${img ? '' : providerSvg('builtin', 64)}</div>
      <div class="sf-detail-meta">
        <div class="sf-detail-title">${escapeHtml(title)}</div>
        ${sub ? `<div class="sf-detail-sub">${escapeHtml(sub)}</div>` : ''}
        <button class="sf-btn-primary" data-act="play-all">
          ${svgIcon('play', 16)} <span>${escapeHtml(playAllLabel)}</span>
        </button>
      </div>
    </div>
    <div id="sf-detail-tracks"><div class="sf-loading">${t(hass, 'loading')} <span class="sf-spinner"></span></div></div>
  `;

  container.querySelector('[data-act="close"]').addEventListener('click', () => card._closeAllPopups());
  container.querySelector('[data-act="back"]').addEventListener('click', () => card._closeDetailsPopup());
  container.querySelector('[data-act="play-all"]').addEventListener('click', () => {
    card._playMediaItem(item, { mediaType: kind, shuffleHint: kind === 'playlist' });
  });

  // Tracks
  const tracks = await getItemTracks(hass, kind, item.uri);
  const list = container.querySelector('#sf-detail-tracks');
  if (!tracks.length) {
    list.innerHTML = `<div class="sf-empty">${t(hass, 'no_items')}</div>`;
    return;
  }
  list.innerHTML = `<div class="sf-list"></div>`;
  const ul = list.querySelector('.sf-list');
  tracks.forEach((tr, idx) => {
    const row = document.createElement('button');
    row.className = 'sf-list-item';
    row.innerHTML = `
      <div class="sf-li-icon" style="${tr.image ? `background-image:url(${JSON.stringify(tr.image).slice(1, -1)});` : ''}">${tr.image ? '' : `<span class="sf-li-idx">${idx + 1}</span>`}</div>
      <div class="sf-li-body">
        <div class="sf-li-title">${escapeHtml(tr.name || '')}</div>
        ${(tr.artist || tr.album) ? `<div class="sf-li-sub">${escapeHtml([tr.artist, kind !== 'album' ? tr.album : ''].filter(Boolean).join(' · '))}</div>` : ''}
      </div>
      <div class="sf-li-chev">${svgIcon('play', 18)}</div>`;
    row.addEventListener('click', () => {
      card._playMediaItem({ uri: tr.uri, name: tr.name, artist: tr.artist }, { mediaType: 'track' });
    });
    ul.appendChild(row);
  });
}

function subForKind(kind, hass) {
  return ({
    album: t(hass, 'album') || 'Album',
    artist: t(hass, 'artist') || 'Artist',
    playlist: t(hass, 'playlist') || 'Playlist'
  })[kind] || '';
}

function playAllLabelForKind(hass, kind) {
  if (kind === 'playlist') return t(hass, 'play_all_shuffle') || 'Play all (shuffle)';
  if (kind === 'album') return t(hass, 'play_album') || 'Play album';
  if (kind === 'artist') return t(hass, 'play_artist') || 'Play all by artist';
  return t(hass, 'play_all') || 'Play all';
}

function escapeHtml(s) { return String(s ?? '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c])); }

/* === src/card.js === */
class SoundFlowCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement('soundflow-card-editor');
  }
  static getStubConfig() {
    return { equalize_volume: 2 };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._modalOpen = false;
    this._popupOpen = null; // 'source' | 'speakers' | 'search' | 'details' | null
    this._detailsView = null; // { kind: 'album'|'artist'|'playlist', item, returnTo: 'search'|'source' }
    this._selectedSpeakers = []; // memória local (preparação)
    this._lastLeader = null;
    this._sourceView = null;
    this._renderedMiniKey = '';
    this._renderedModalKey = '';
    this._renderedSpeakersKey = '';
    this._tickHandle = null;
    this._cachedProviders = null;
    this._libCache = new Map(); // key -> { ts, data }
    this._searchResults = null;
    this._searchQuery = '';
  }

  setConfig(config) {
    this._config = { equalize_volume: 2, hide_radio_search: true, ...config };
    this._render();
  }

  set hass(hass) {
    const prevHass = this._hass;
    this._hass = hass;
    // Sincronizar ANTES do render para o popup ver o estado actualizado
    this._syncSelectionToState();
    if (!this.shadowRoot.firstChild) this._render();
    else this._softUpdate(prevHass);
    this._maintainLeader();
  }

  // _selectedSpeakers é a intenção do utilizador. SÓ é populado a partir do HA:
  //   - na primeira passagem (utilizador ainda não interagiu)
  //   - ou quando está vazio e há música a tocar
  // NUNCA sobrescreve uma seleção existente do utilizador (caso contrário, se
  // MA falhar o join cross-protocol, a UI revertia a seleção sozinha).
  _syncSelectionToState() {
    if (this._lastUserActionTs) return;                                  // user já interagiu — preservar
    if ((this._selectedSpeakers || []).length > 0) return;               // já temos seleção — preservar
    const grp = this._activeGroup();
    if (!grp || grp.members.length === 0) return;
    this._selectedSpeakers = [...grp.members];
  }
  get hass() { return this._hass; }

  getCardSize() { return 2; }

  // ============ DERIVED STATE ============

  _allMassPlayers() {
    if (!this._hass) return [];
    return listMassPlayers(this._hass);
  }
  _visiblePlayers() {
    const all = this._allMassPlayers();
    const allow = this._config?.players;
    if (!allow || !Array.isArray(allow) || allow.length === 0) return all;
    const set = new Set(allow);
    return all.filter(p => set.has(p.entity_id));
  }
  _activeGroup() {
    return getActiveGroup(this._hass, this._allMassPlayers());
  }
  _activeSelection() {
    // _selectedSpeakers é a única fonte de verdade.
    // Sincronização com grp.members acontece em _syncSelectionToState.
    return [...(this._selectedSpeakers || [])];
  }
  _displayPlayer() {
    const grp = this._activeGroup();
    if (grp?.leader) return grp.leader;
    // Se o utilizador acabou de selecionar alguma coluna, mostrar essa
    if (this._selectedSpeakers.length > 0) {
      const first = this._allMassPlayers().find(p => p.entity_id === this._selectedSpeakers[0]);
      if (first) return first.entity_id;
    }
    const all = this._allMassPlayers();
    if (this._config?.default_player && this._config.default_player !== 'auto') {
      const found = all.find(p => p.entity_id === this._config.default_player);
      if (found) return found.entity_id;
    }
    return lastPlayedPlayer(this._hass, this._visiblePlayers());
  }
  _playTarget() {
    // Para onde tocamos algo novo: selecção activa OU display player.
    const sel = this._activeSelection();
    if (sel.length === 0) {
      const dp = this._displayPlayer();
      return { leader: dp, members: dp ? [dp] : [] };
    }
    if (sel.length === 1) return { leader: sel[0], members: sel };
    // Escolher um leader aleatório das colunas selecionadas (apenas se for a primeira play).
    const grp = this._activeGroup();
    if (grp?.leader && sel.includes(grp.leader)) return { leader: grp.leader, members: sel };
    const leader = pickRandomLeader(sel);
    return { leader, members: sel };
  }

  // ============ RENDER ============

  _render() {
    if (!this._config) return;
    const sr = this.shadowRoot;
    sr.innerHTML = `<style>${CSS}</style><div id="sf-root"></div>`;
    this._root = sr.getElementById('sf-root');
    if (this._hass) applyTheme(this._root, this._hass);
    this._renderMini();
  }

  _softUpdate(prevHass) {
    applyTheme(this._root, this._hass);
    const miniKey = this._miniKey();
    const modalKey = this._modalKey();
    const speakersKey = this._speakersKey();

    if (miniKey !== this._renderedMiniKey) {
      this._renderedMiniKey = miniKey;
      this._renderMini();
    } else if (!this._modalOpen) {
      this._updateMiniProgress();
    }

    if (this._modalOpen) {
      if (this._popupOpen === 'speakers') {
        const inWindow = this._lastUserActionTs && Date.now() - this._lastUserActionTs < 1500;
        if (inWindow) {
          // Não rebuild o DOM (interrompe cliques); só actualiza volumes
          this._updateSpeakerVolumesSurgical();
        } else if (speakersKey !== this._renderedSpeakersKey) {
          this._renderedSpeakersKey = speakersKey;
          this._renderPopup();
        } else {
          this._updateSpeakerVolumesSurgical();
        }
      } else if (!this._popupOpen) {
        if (modalKey !== this._renderedModalKey) {
          this._renderedModalKey = modalKey;
          this._renderModalContent();
        } else {
          this._updateProgress();
        }
      }
      // popups source/search são data-driven — não reagem a hass
    }
  }

  _miniKey() {
    const dp = this._displayPlayer();
    const s = this._hass.states[dp] || {};
    const a = s.attributes || {};
    const pending = this._pendingMedia ? this._pendingMedia.label : '';
    return [dp, s.state, a.media_title, a.media_artist, a.entity_picture, pending].join('::');
  }
  _modalKey() {
    const dp = this._displayPlayer();
    const s = this._hass.states[dp] || {};
    const a = s.attributes || {};
    const grp = this._activeGroup();
    const sel = this._activeSelection().sort().join(',');
    const pending = this._pendingMedia ? this._pendingMedia.label : '';
    return [
      dp, s.state, a.media_title, a.media_artist, a.entity_picture, a.shuffle, a.repeat,
      Math.round((a.volume_level || 0) * 100), a.is_volume_muted ? 1 : 0,
      grp?.leader || '', sel, pending
    ].join('::');
  }
  _speakersKey() {
    // Não inclui volumes (esses actualizam-se cirurgicamente sem rebuild)
    const grp = this._activeGroup();
    const sel = this._activeSelection().sort().join(',');
    return [grp?.leader || '', (grp?.members || []).slice().sort().join('|'), sel].join('::');
  }
  _updateSpeakerVolumesSurgical() {
    const host = this._popupHost();
    if (!host) return;
    for (const node of host.querySelectorAll('.sf-spk')) {
      const id = node.dataset.entity;
      const a = this._hass.states[id]?.attributes || {};
      const vol = Math.round((a.volume_level || 0) * 100);
      const bar = node.querySelector('.sf-volume-bar > span');
      if (bar) bar.style.width = vol + '%';
      const pct = node.querySelector('.sf-volume-pct');
      if (pct) pct.textContent = vol + '%';
    }
  }

  _renderMini() {
    if (!this._root || !this._hass) return;
    const dp = this._displayPlayer();
    const s = this._hass.states[dp];
    const info = getMediaInfo(s);
    const playing = isPlaying(s);
    const titleCfg = this._config.title;

    if (!s) {
      this._root.innerHTML = `<div class="sf-mini" data-empty="1"><div class="sf-mini-info"><div class="sf-mini-title">${t(this._hass, 'card_name')}</div><div class="sf-mini-subtitle">${t(this._hass, 'error_no_players')}</div></div></div>`;
      return;
    }

    const title = info.title || titleCfg || t(this._hass, 'nothing_playing');
    const subtitle = (info.artist || '') + (info.artist && s.attributes.friendly_name ? ' · ' : '') + (s.attributes.friendly_name || '');
    const cover = info.image ? this._absUrl(info.image) : '';

    const progress = info.duration ? Math.min(100, (livePosition(info, s) / info.duration) * 100) : 0;

    const pending = this._pendingMedia;
    this._root.innerHTML = `
      ${titleCfg ? `<div style="font-size:13px;color:var(--sf-text-dim);margin:0 4px 6px;font-weight:600;">${escapeHtml(titleCfg)}</div>` : ''}
      <div class="sf-mini" data-playing="${playing ? 1 : 0}" data-pending="${pending ? 1 : 0}">
        <div class="sf-mini-cover" style="${cover ? `background-image:url(${JSON.stringify(cover).slice(1, -1)});` : ''}">${cover ? '' : svgIcon('music', 28)}</div>
        <div class="sf-mini-info">
          <div class="sf-mini-title">${escapeHtml(title)}</div>
          <div class="sf-mini-subtitle">${escapeHtml(subtitle)}</div>
          ${pending ? `<div class="sf-mini-pending">▶ ${escapeHtml(pending.label || '')}</div>` : ''}
        </div>
        <div class="sf-mini-controls">
          <button class="sf-circle-btn" data-act="prev" aria-label="${t(this._hass, 'play')}">${svgIcon('prev', 22)}</button>
          <button class="sf-circle-btn sf-primary ${pending ? 'sf-pending' : ''}" data-act="playpause">${svgIcon(pending ? 'play' : (playing ? 'pause' : 'play'), 22, 'white')}</button>
          <button class="sf-circle-btn" data-act="next">${svgIcon('next', 22)}</button>
        </div>
        <div class="sf-progress"><span style="width:${progress}%"></span></div>
      </div>`;

    const mini = this._root.querySelector('.sf-mini');
    mini.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-act]')) return;
      this._openModal();
    });
    mini.querySelector('[data-act="prev"]').addEventListener('click', (e) => { e.stopPropagation(); prev(this._hass, dp); });
    mini.querySelector('[data-act="next"]').addEventListener('click', (e) => { e.stopPropagation(); next(this._hass, dp); });
    mini.querySelector('[data-act="playpause"]').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (this._pendingMedia) { await this._executePending(); return; }
      if (playing) pause(this._hass, dp);
      else play(this._hass, dp);
    });
    this._scheduleTick();
  }

  _updateMiniProgress() {
    const bar = this._root?.querySelector('.sf-mini .sf-progress > span');
    if (!bar) return;
    const dp = this._displayPlayer();
    const s = this._hass.states[dp];
    const info = getMediaInfo(s);
    const pct = info.duration ? Math.min(100, (livePosition(info, s) / info.duration) * 100) : 0;
    bar.style.width = pct + '%';
  }

  _scheduleTick() {
    if (this._tickHandle) return;
    this._tickHandle = setInterval(() => {
      if (!this.isConnected) { clearInterval(this._tickHandle); this._tickHandle = null; return; }
      if (this._modalOpen && !this._popupOpen) this._updateProgress();
      else if (!this._modalOpen) this._updateMiniProgress();
    }, 1000);
  }

  // ============ MODAL ============

  _openModal() {
    this._modalOpen = true;
    this._popupOpen = null;
    this._renderModal();
  }
  _closeModal() {
    this._modalOpen = false;
    this._popupOpen = null;
    const m = this.shadowRoot.querySelector('.sf-modal-backdrop');
    if (m) m.remove();
  }
  _closeAllPopups() {
    if (this._popupOpen) { this._popupOpen = null; this._sourceView = null; this._detailsView = null; this._renderModal(); }
    else this._closeModal();
  }
  _popupHost() {
    return this.shadowRoot.querySelector('#sf-modal-content');
  }

  _renderModal() {
    const sr = this.shadowRoot;
    let backdrop = sr.querySelector('.sf-modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sf-modal-backdrop';
      backdrop.innerHTML = `<div class="sf-modal" id="sf-modal"><div id="sf-modal-content"></div></div>`;
      backdrop.addEventListener('click', (e) => { if (e.target === backdrop) this._closeModal(); });
      sr.appendChild(backdrop);
    }
    this._popupOpen = null;
    this._renderModalContent();
  }

  _renderModalContent() {
    const dp = this._displayPlayer();
    const s = this._hass.states[dp];
    const info = getMediaInfo(s);
    const playing = isPlaying(s);
    const cover = info.image ? this._absUrl(info.image) : '';
    const sel = this._activeSelection();
    const selLabel = sel.length === 0 ? t(this._hass, 'none')
      : sel.length === 1 ? (this._hass.states[sel[0]]?.attributes?.friendly_name || sel[0])
      : t(this._hass, 'n_speakers', { n: sel.length });

    // Volume / mute reflectem o leader / display.
    const volPct = Math.round((info.volume || 0) * 100);

    // Provider para o pill "Fonte"
    const providerLabel = providerLabelOf(s) || t(this._hass, 'choose_source');

    const dur = info.duration || 0;
    const pos = livePosition(info, s);
    const pct = dur ? Math.min(100, (pos / dur) * 100) : 0;

    const isRadio = (info.contentType === 'radio') || /radio/i.test(info.contentType || '');
    const showSearch = !(this._config.hide_radio_search && isRadio);

    const host = this.shadowRoot.querySelector('#sf-modal-content');
    host.innerHTML = `
      <div class="sf-modal-header">
        <button class="sf-circle-btn" data-act="close" aria-label="${t(this._hass, 'close')}">${svgIcon('close', 18)}</button>
      </div>
      ${cover ? `<div class="sf-modal-cover" style="background-image:url(${JSON.stringify(cover).slice(1, -1)});"></div>` : `<div class="sf-modal-cover">${svgIcon('music', 64)}</div>`}
      <div class="sf-modal-title">${escapeHtml(info.title || t(this._hass, 'nothing_playing'))}</div>
      <div class="sf-modal-artist">${escapeHtml(info.artist || s?.attributes?.friendly_name || '')}</div>

      <div class="sf-seek">
        <span>${formatTime(pos)}</span>
        <div class="sf-seek-track" id="sf-seek"><span style="width:${pct}%"></span></div>
        <span>${formatTime(dur)}</span>
      </div>

      <div class="sf-transport">
        <button class="sf-circle-btn sf-icon-toggle" data-act="shuffle" data-on="${info.shuffle ? 1 : 0}">${svgIcon('shuffle', 22)}</button>
        <button class="sf-circle-btn" data-act="prev">${svgIcon('prev', 22)}</button>
        <button class="sf-circle-btn sf-primary sf-play ${this._pendingMedia ? 'sf-pending' : ''}" data-act="playpause">${svgIcon(this._pendingMedia ? 'play' : (playing ? 'pause' : 'play'), 28, 'white')}</button>
        <button class="sf-circle-btn" data-act="next">${svgIcon('next', 22)}</button>
        <button class="sf-circle-btn sf-icon-toggle" data-act="repeat" data-on="${info.repeat && info.repeat !== 'off' ? 1 : 0}">${svgIcon(info.repeat === 'one' ? 'repeat_one' : 'repeat', 22)}</button>
      </div>
      ${this._pendingMedia ? `<div style="text-align:center;font-size:12px;color:#EA3572;font-weight:600;margin-bottom:6px;">▶ ${escapeHtml(this._pendingMedia.label || '')}</div>` : ''}

      <div class="sf-row2">
        <button class="sf-pill" data-act="open-source">
          <div class="sf-pill-icon">${svgIcon('music', 20, 'white')}</div>
          <div style="min-width:0;">
            <div class="sf-pill-label">${t(this._hass, 'choose_source').toUpperCase()}</div>
            <div class="sf-pill-value">${escapeHtml(providerLabel)}</div>
          </div>
        </button>
        <button class="sf-pill" data-act="open-speakers">
          <div class="sf-pill-icon">${svgIcon('vol_high', 20, 'white')}</div>
          <div style="min-width:0;">
            <div class="sf-pill-label">${t(this._hass, 'speakers').toUpperCase()}</div>
            <div class="sf-pill-value">${escapeHtml(selLabel)}</div>
          </div>
        </button>
      </div>

      ${showSearch ? `
      <form class="sf-search-row" data-act="search-form">
        <input type="search" placeholder="${t(this._hass, 'search_placeholder')}" id="sf-q" autocomplete="off"/>
        <button type="submit" class="sf-search-btn" aria-label="search">${svgIcon('search', 18, 'white')}</button>
      </form>` : ''}

      <div class="sf-volume-row">
        <button class="sf-vol-btn" data-act="vol-down">${svgIcon('minus', 16)}</button>
        <div class="sf-volume-bar" data-act="vol-bar"><span style="width:${volPct}%"></span></div>
        <span class="sf-volume-pct">${volPct}%</span>
        <button class="sf-vol-btn" data-act="vol-up">${svgIcon('plus', 16)}</button>
        <button class="sf-mute" data-act="mute" data-muted="${info.muted ? 1 : 0}" aria-label="mute">${svgIcon(info.muted ? 'vol_off' : 'vol_high', 18)}</button>
      </div>
      <button class="sf-equalize" data-act="equalize">${t(this._hass, 'equalize_volume')} → ${this._config.equalize_volume ?? 2}%</button>
    `;

    this._wireModalEvents(host, dp);
  }

  _updateProgress() {
    const host = this.shadowRoot.querySelector('#sf-modal-content');
    if (!host) return;
    const dp = this._displayPlayer();
    const s = this._hass.states[dp];
    const info = getMediaInfo(s);
    const dur = info.duration || 0;
    const pos = livePosition(info, s);
    const pct = dur ? Math.min(100, (pos / dur) * 100) : 0;
    const bar = host.querySelector('#sf-seek > span');
    if (bar) bar.style.width = pct + '%';
    const seek = host.querySelector('.sf-seek');
    if (seek) {
      seek.firstElementChild.textContent = formatTime(pos);
      seek.lastElementChild.textContent = formatTime(dur);
    }
  }

  _wireModalEvents(host, dp) {
    const sel = this._activeSelection();
    const targets = sel.length ? sel : [dp];

    host.querySelector('[data-act="close"]').addEventListener('click', () => this._closeModal());
    host.querySelector('[data-act="prev"]').addEventListener('click', () => prev(this._hass, dp));
    host.querySelector('[data-act="next"]').addEventListener('click', () => next(this._hass, dp));
    host.querySelector('[data-act="playpause"]').addEventListener('click', async () => {
      if (this._pendingMedia) { await this._executePending(); return; }
      const isP = isPlaying(this._hass.states[dp]);
      isP ? pause(this._hass, dp) : play(this._hass, dp);
    });
    host.querySelector('[data-act="shuffle"]').addEventListener('click', () => {
      const cur = !!this._hass.states[dp]?.attributes?.shuffle;
      setShuffle(this._hass, dp, !cur);
    });
    host.querySelector('[data-act="repeat"]').addEventListener('click', () => {
      const cur = this._hass.states[dp]?.attributes?.repeat || 'off';
      const nx = cur === 'off' ? 'all' : cur === 'all' ? 'one' : 'off';
      setRepeat(this._hass, dp, nx);
    });
    host.querySelector('[data-act="open-source"]').addEventListener('click', () => this._openSource());
    host.querySelector('[data-act="open-speakers"]').addEventListener('click', () => this._openSpeakers());
    host.querySelector('[data-act="vol-down"]').addEventListener('click', () => targets.forEach(id => this._adjustVolume(id, -0.05)));
    host.querySelector('[data-act="vol-up"]').addEventListener('click', () => targets.forEach(id => this._adjustVolume(id, +0.05)));
    host.querySelector('[data-act="vol-bar"]').addEventListener('click', (ev) => {
      const rect = ev.currentTarget.getBoundingClientRect();
      const pct = (ev.clientX - rect.left) / rect.width;
      targets.forEach(id => this._setVolume(id, pct));
    });
    host.querySelector('[data-act="mute"]').addEventListener('click', () => {
      const muted = !!this._hass.states[dp]?.attributes?.is_volume_muted;
      targets.forEach(id => setMute(this._hass, id, !muted));
    });
    host.querySelector('[data-act="equalize"]').addEventListener('click', () => this._equalizeVolume());
    const form = host.querySelector('[data-act="search-form"]');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = host.querySelector('#sf-q').value.trim();
        if (q) this._runSearch(q);
      });
    }
  }

  // ============ POPUPS ============

  _renderPopup() {
    const host = this._popupHost();
    if (!host) return;
    if (this._popupOpen === 'speakers') renderSpeakersPopup(this, host);
    else if (this._popupOpen === 'source') renderSourcePopup(this, host);
    else if (this._popupOpen === 'search') renderSearchResults(this, host, this._searchResults || { _query: this._searchQuery });
    else if (this._popupOpen === 'details') renderDetailsPopup(this, host);
  }
  _openMediaDetails(item, kind) {
    if (!item || !['album', 'artist', 'playlist'].includes(kind)) return;
    this._detailsView = { kind, item, returnTo: this._popupOpen || 'search' };
    this._popupOpen = 'details';
    this._renderPopup();
  }
  _closeDetailsPopup() {
    const returnTo = this._detailsView?.returnTo || 'search';
    this._detailsView = null;
    this._popupOpen = returnTo;
    this._renderPopup();
  }
  _openSpeakers() {
    // Cada vez que o popup abre, sincroniza com o estado REAL do HA.
    // Permite multi-browser sync e evita ver estado obsoleto.
    const grp = this._activeGroup();
    if (grp && grp.members.length > 0) {
      this._selectedSpeakers = [...grp.members];
    }
    this._lastUserActionTs = 0; // permite re-sync subsequente
    this._renderedSpeakersKey = '';
    this._popupOpen = 'speakers';
    this._renderPopup();
  }
  _openSource() { this._sourceView = { view: 'root' }; this._popupOpen = 'source'; this._renderPopup(); }

  // ============ ACTIONS ============

  async _toggleSpeaker(id) {
    const beforeSel = new Set(this._activeSelection());
    const willHave = new Set(beforeSel);
    if (willHave.has(id)) willHave.delete(id); else willHave.add(id);

    // Update óptico imediato (anti-flicker)
    this._selectedSpeakers = [...willHave];
    this._lastUserActionTs = Date.now();
    this._renderPopup();

    // Debounce: cliques rápidos resolvem-se num único commit. Sem isto, o MA falha
    // com `group_many: groupId does not exist` quando dispara joins encadeados antes
    // do líder ter formado grupo.
    this._scheduleCommit();
  }

  _scheduleCommit() {
    if (this._commitTimer) clearTimeout(this._commitTimer);
    this._commitTimer = setTimeout(() => this._commitSelection(), 350);
  }

  async _commitSelection() {
    this._commitTimer = null;
    if (this._commitInFlight) { this._commitPending = true; return; }
    this._commitInFlight = true;
    try {
      const desired = new Set(this._activeSelection());
      const grp = this._activeGroup();
      const currentLeader = grp?.leader || null;
      const currentAll = grp ? new Set([grp.leader, ...grp.members]) : new Set();

      if (desired.size === 0) {
        // Sem selecção: dissolver tudo o que estiver agrupado entre os visíveis
        for (const p of this._visiblePlayers()) {
          if (currentAll.has(p.entity_id)) {
            try { await unjoin(this._hass, p.entity_id); } catch (e) {}
          }
        }
      } else if (desired.size === 1) {
        // Só uma coluna: separar os outros membros do grupo (deixar a coluna sozinha)
        const only = [...desired][0];
        const others = [...currentAll].filter(x => x !== only);
        for (const m of others) {
          try { await unjoin(this._hass, m); } catch (e) {}
        }
      } else {
        // 2+ colunas: formar grupo coerente com 1 join (batch).
        const arr = [...desired];
        // Manter líder actual se estiver na selecção, senão eleger novo
        const leader = currentLeader && desired.has(currentLeader) ? currentLeader : pickRandomLeader(arr);
        const wantedMembers = new Set(arr.filter(x => x !== leader));
        const currentMembers = new Set([...currentAll].filter(x => x !== leader));
        const leaderChanged = currentLeader && currentLeader !== leader && currentAll.has(currentLeader);
        const oldLeaderHadMedia = leaderChanged && this._playerHasMedia(currentLeader);

        // 1) Tirar membros que já não queremos
        const toRemove = [...currentMembers].filter(x => !wantedMembers.has(x));
        for (const m of toRemove) {
          try { await unjoin(this._hass, m); } catch (e) {}
        }
        // 2) Se mudámos de líder, ungroup do líder antigo para libertar o seu groupId
        if (leaderChanged) {
          try { await unjoin(this._hass, currentLeader); } catch (e) {}
        }
        // 3) Pequena pausa antes do join — dá tempo ao MA/Sonos para estabilizar
        //    o estado dos ungroups antes de pedir um novo group_many.
        const toAdd = [...wantedMembers].filter(x => x !== leader);
        if (toAdd.length) {
          if (toRemove.length || leaderChanged) await sleep(300);
          await joinPlayers(this._hass, leader, toAdd);
        }
        // 4) Se a liderança mudou e o antigo líder estava a tocar, transferir
        //    a queue MA para o novo líder. Sem isto, a música simplesmente pára
        //    quando o user desselecciona/troca o líder — testado e funciona limpo.
        if (oldLeaderHadMedia) {
          await sleep(300);
          try { await transferQueue(this._hass, currentLeader, leader, true); }
          catch (e) { console.warn('SoundFlow: transfer_queue failed', e); }
        }
      }
    } catch (e) {
      console.warn('SoundFlow: commit failed', e);
    } finally {
      this._commitInFlight = false;
      setTimeout(() => { this._renderedSpeakersKey = ''; this._renderPopup(); }, 500);
      if (this._commitPending) {
        this._commitPending = false;
        this._scheduleCommit();
      }
    }
  }

  // Devolve um source player para transferir queue (caso recente), uma vez só.
  _consumePendingSource(targets) {
    if (!this._sourceForContinuity) return null;
    if (Date.now() - this._sourceForContinuityTs > 60_000) { this._sourceForContinuity = null; return null; }
    if (targets.includes(this._sourceForContinuity)) { this._sourceForContinuity = null; return null; }
    const src = this._sourceForContinuity;
    this._sourceForContinuity = null;
    // Verificar se o source ainda tem queue (idle/paused com media_title)
    const s = this._hass.states[src];
    if (!s) return null;
    if (s.state === 'unavailable' || s.state === 'off') return null;
    if (!s.attributes?.media_title && !s.attributes?.media_content_id) return null;
    return src;
  }

  async _toggleAll(currentlyAll) {
    const visible = this._visiblePlayers();
    const grp = this._activeGroup();
    if (currentlyAll) {
      this._selectedSpeakers = [];
      this._lastUserActionTs = Date.now();
      this._renderPopup();
      for (const p of visible) { try { await unjoin(this._hass, p.entity_id); } catch (e) {} }
    } else {
      const ids = visible.map(p => p.entity_id);
      this._selectedSpeakers = ids;
      this._lastUserActionTs = Date.now();
      this._renderPopup();
      // Se já há um líder a tocar, juntar os restantes a ele (sem cortar)
      const leader = grp?.leader && ids.includes(grp.leader) ? grp.leader : pickRandomLeader(ids);
      const members = ids.filter(x => x !== leader);
      if (members.length) await joinPlayers(this._hass, leader, members);
    }
    setTimeout(() => { this._renderedSpeakersKey = ''; this._renderPopup(); }, 500);
  }

  _playerHasMedia(entityId) {
    const s = this._hass?.states?.[entityId];
    if (!s) return false;
    if (s.state === 'unavailable' || s.state === 'off') return false;
    return !!(s.attributes?.media_title || s.attributes?.media_content_id);
  }

  async _maintainLeader() {
    // Apenas tracking. Transferência de liderança acontece em _toggleSpeaker
    // quando o utilizador remove o leader explicitamente. Disparar transfer_queue
    // automaticamente em estados transientes (entre faixas, etc.) interrompia
    // a reprodução.
    const grp = this._activeGroup();
    this._lastLeader = grp?.leader || null;
  }

  async _adjustVolume(id, delta) {
    const cur = Number(this._hass.states[id]?.attributes?.volume_level || 0);
    return setVolume(this._hass, id, Math.max(0, Math.min(1, cur + delta)));
  }
  async _setVolume(id, pct) {
    return setVolume(this._hass, id, Math.max(0, Math.min(1, pct)));
  }
  async _equalizeVolume() {
    const pct = (this._config.equalize_volume ?? 2) / 100;
    const targets = this._activeSelection();
    const ids = targets.length ? targets : this._visiblePlayers().map(p => p.entity_id);
    for (const id of ids) await setVolume(this._hass, id, pct);
    this._toast(t(this._hass, 'volume_equalized', { n: this._config.equalize_volume ?? 2 }));
  }

  // ============ DATA HELPERS ============

  async _getProviders() {
    if (this._cachedProviders) return this._cachedProviders;
    const list = await getProviders(this._hass);
    this._cachedProviders = list;
    return list;
  }
  async _getLibrary(kind, opts = {}) {
    const key = JSON.stringify({ kind, ...opts });
    const cached = this._libCache.get(key);
    if (cached && (Date.now() - cached.ts < 60_000)) return cached.data;
    const data = await getLibrary(this._hass, null, kind, opts);
    this._libCache.set(key, { ts: Date.now(), data });
    return data;
  }

  // Deferred playback: selecionar media só GUARDA pendente.
  // O play_media só dispara quando user carrega no botão Play.
  _playMediaItem(it, opts = {}) {
    const mediaId = it.uri || it.media_content_id || it.media_id || it.id;
    const mediaType = opts.mediaType || it.media_type || (it.media_content_type === 'music' ? 'track' : it.media_content_type);
    const isPlaylist = mediaType === 'playlist' || mediaType === 'album';
    const shuffle = opts.shuffleHint || isPlaylist || opts.shuffle;
    this._pendingMedia = {
      mediaId, mediaType, shuffle,
      label: it.name || it.title || it.uri || ''
    };
    this._closeAllPopups();
    this._toast(t(this._hass, 'pending_set'));
    this._renderedMiniKey = '';
    this._renderMini();
    if (this._modalOpen && !this._popupOpen) this._renderModalContent();
  }
  async _playAllTracksShuffle() {
    // Anti-lazy-queue do Sonos: NÃO mandar 100+ URIs de uma vez (sobrecarrega o
    // download item-a-item, causa pauses/skips). Enviar APENAS 1 track random
    // + radio_mode=true → MA gera tracks similares dinamicamente, queue leve.
    const items = await this._getLibrary('tracks', { limit: 200, orderBy: 'random' });
    if (!items || !items.length) { this._toast(t(this._hass, 'no_items')); return; }
    const seed = items[Math.floor(Math.random() * items.length)];
    const seedId = seed.uri || seed.media_id;
    this._pendingMedia = {
      mediaId: seedId, mediaType: 'track', shuffle: false, radioMode: true,
      label: t(this._hass, 'all_tracks')
    };
    this._closeAllPopups();
    this._toast(t(this._hass, 'pending_set'));
    this._renderedMiniKey = '';
    this._renderMini();
    if (this._modalOpen && !this._popupOpen) this._renderModalContent();
  }
  async _playProviderTracksShuffle(providerInstanceId, label) {
    // Restringir a tracks adicionadas via este provider (ex.: "Apple Music — Bruno").
    // Estratégia: fetch até 500 tracks aleatórias do provider, passar como array
    // + shuffle. MA já validou em produção que ~1500 URIs aguentam o queue.
    // Se o provider tiver menos tracks, o MA devolve só essas — sem problema.
    const items = await getLibraryTracksByProvider(this._hass, providerInstanceId, {
      limit: 500, orderBy: 'random'
    });
    if (!items || !items.length) { this._toast(t(this._hass, 'no_items')); return; }
    const uris = items.map(it => it.uri).filter(Boolean);
    if (!uris.length) { this._toast(t(this._hass, 'no_items')); return; }
    this._pendingMedia = {
      mediaId: uris, mediaType: 'track', shuffle: true, radioMode: false,
      label: label || t(this._hass, 'all_tracks')
    };
    this._closeAllPopups();
    this._toast(t(this._hass, 'pending_set'));
    this._renderedMiniKey = '';
    this._renderMini();
    if (this._modalOpen && !this._popupOpen) this._renderModalContent();
  }
  // Executa o pendente: garante que o grupo correcto está formado e dispara play_media.
  async _executePending() {
    if (!this._pendingMedia) return false;
    const target = this._playTarget();
    if (!target.leader) { this._toast(t(this._hass, 'pending_pick_speakers')); return false; }
    // Garantir grupo formado antes de play
    if (target.members.length > 1) {
      const others = target.members.filter(x => x !== target.leader);
      try { await joinPlayers(this._hass, target.leader, others); } catch (e) {}
      await sleep(200);
    }
    const { mediaId, mediaType, shuffle, radioMode } = this._pendingMedia;
    await playMedia(this._hass, target.leader, mediaId, {
      mediaType, enqueue: 'replace', shuffle, radioMode: !!radioMode
    });
    this._pendingMedia = null;
    this._renderedMiniKey = '';
    this._renderMini();
    if (this._modalOpen && !this._popupOpen) this._renderModalContent();
    return true;
  }

  async _runSearch(query) {
    this._searchQuery = query;
    this._popupOpen = 'search';
    this._searchResults = { _query: query, tracks: [], albums: [], artists: [], playlists: [], radios: [] };
    this._renderPopup();
    // Tenta primeiro library-only (na biblioteca selecionada via último provider, se houver)
    const provider = this._sourceView?.provider?.instance || null;
    let r = await search(this._hass, null, query, { libraryOnly: true, providerInstanceId: provider });
    const isEmpty = !r || (!r.tracks?.length && !r.albums?.length && !r.artists?.length && !r.playlists?.length && !r.radios?.length);
    if (isEmpty) {
      r = await search(this._hass, null, query, { libraryOnly: false, providerInstanceId: provider });
    }
    this._searchResults = { _query: query, ...r };
    this._renderPopup();
  }

  // ============ UTILS ============

  _absUrl(u) {
    if (!u) return '';
    if (/^https?:/i.test(u) || u.startsWith('data:')) return u;
    if (this._hass?.hassUrl) return this._hass.hassUrl(u);
    return u;
  }
  _toast(text) {
    const host = this.shadowRoot.querySelector('.sf-modal') || this._root;
    if (!host) return;
    const div = document.createElement('div');
    div.className = 'sf-toast';
    div.textContent = text;
    host.appendChild(div);
    setTimeout(() => div.remove(), 2000);
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function providerLabelOf(state) {
  const a = state?.attributes || {};
  return a.media_content_type === 'radio' ? 'Rádio' : (a.media_album_name || a.app_name || a.source || '');
}

function escapeHtml(s) { return String(s ?? '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c])); }

/* === src/editor.js === */
class SoundFlowCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._tab = 'config';
  }
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) { this._hass = hass; if (!this.shadowRoot.firstChild) this._render(); }
  get hass() { return this._hass; }

  _emit() {
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }

  _render() {
    if (!this._config) this._config = {};
    const sr = this.shadowRoot;
    sr.innerHTML = `<style>${CSS}</style><div id="sf-root"></div>`;
    const root = sr.getElementById('sf-root');
    if (this._hass) applyTheme(root, this._hass);
    const players = this._hass ? listMassPlayers(this._hass) : [];
    const tabs = ['config', 'visibility', 'layout'];
    const tabLabel = (k) => t(this._hass, k === 'config' ? 'tab_config' : k === 'visibility' ? 'tab_visibility' : 'tab_layout');

    root.innerHTML = `
      <div class="sf-editor">
        <div style="display:flex;gap:6px;border-bottom:1px solid var(--sf-border);padding-bottom:8px;">
          ${tabs.map(k => `<button data-tab="${k}" style="padding:6px 12px;border-radius:8px;${this._tab===k?'background:var(--sf-surface-2);font-weight:600;':''}">${tabLabel(k)}</button>`).join('')}
        </div>
        <div id="sf-tab-body"></div>
      </div>`;
    root.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { this._tab = b.dataset.tab; this._render(); }));
    const body = root.querySelector('#sf-tab-body');

    if (this._tab === 'config') this._renderConfigTab(body, players);
    else if (this._tab === 'visibility') this._renderVisibilityTab(body, players);
    else this._renderLayoutTab(body);
  }

  _renderConfigTab(body, players) {
    body.innerHTML = `
      <label>${t(this._hass, 'card_title')}
        <input type="text" id="title" value="${escapeAttr(this._config.title || '')}" placeholder="(opcional)"/>
        <span class="sf-editor-help">${t(this._hass, 'card_title_help')}</span>
      </label>
      <label>${t(this._hass, 'default_player')}
        <select id="default_player">
          <option value="auto" ${(!this._config.default_player || this._config.default_player==='auto')?'selected':''}>${t(this._hass, 'default_player_auto')}</option>
          ${players.map(p => `<option value="${p.entity_id}" ${this._config.default_player===p.entity_id?'selected':''}>${escapeHtml(p.name)} (${p.entity_id})</option>`).join('')}
        </select>
        <span class="sf-editor-help">${t(this._hass, 'default_player_help')}</span>
      </label>
      <label>${t(this._hass, 'equalize_pct')}
        <input type="number" id="equalize_volume" min="0" max="100" value="${this._config.equalize_volume ?? 2}"/>
        <span class="sf-editor-help">${t(this._hass, 'equalize_help')}</span>
      </label>
      <label class="sf-checkrow">
        <input type="checkbox" id="hide_radio_search" ${this._config.hide_radio_search!==false?'checked':''}/> ${t(this._hass, 'hide_radio_search')}
      </label>
    `;
    body.querySelector('#title').addEventListener('change', e => { this._config.title = e.target.value || undefined; this._emit(); });
    body.querySelector('#default_player').addEventListener('change', e => { this._config.default_player = e.target.value === 'auto' ? undefined : e.target.value; this._emit(); });
    body.querySelector('#equalize_volume').addEventListener('change', e => { this._config.equalize_volume = Number(e.target.value) || 2; this._emit(); });
    body.querySelector('#hide_radio_search').addEventListener('change', e => { this._config.hide_radio_search = e.target.checked; this._emit(); });
  }

  _renderVisibilityTab(body, players) {
    const selected = new Set(this._config.players || []);
    const count = selected.size;
    body.innerHTML = `
      <h4>${t(this._hass, 'visible_players')}${count ? ` (${t(this._hass,'n_selected',{n:count})})` : ''}</h4>
      <span class="sf-editor-help">${t(this._hass, 'visible_players_help')}</span>
      <div>
        ${players.map(p => `
          <label class="sf-pl">
            <input type="checkbox" data-id="${p.entity_id}" ${selected.has(p.entity_id)?'checked':''}/>
            <span><strong>${escapeHtml(p.name)}</strong> <span style="color:var(--sf-text-dim);">(${p.entity_id})</span></span>
          </label>`).join('')}
      </div>`;
    body.querySelectorAll('input[data-id]').forEach(cb => cb.addEventListener('change', () => {
      const set = new Set(this._config.players || []);
      if (cb.checked) set.add(cb.dataset.id); else set.delete(cb.dataset.id);
      this._config.players = set.size ? [...set] : undefined;
      this._emit();
      this._render();
    }));
  }

  _renderLayoutTab(body) {
    body.innerHTML = `<div class="sf-editor-help">${t(this._hass, 'tab_layout')} — em breve.</div>`;
  }
}

function escapeHtml(s) { return String(s ?? '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeAttr(s) { return escapeHtml(s); }

/* === src/index.js === */
const VERSION = '1.0.1';

if (!customElements.get('soundflow-card')) {
  customElements.define('soundflow-card', SoundFlowCard);
}
if (!customElements.get('soundflow-card-editor')) {
  customElements.define('soundflow-card-editor', SoundFlowCardEditor);
}

window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === 'soundflow-card')) {
  window.customCards.push({
    type: 'soundflow-card',
    name: 'SoundFlow Card',
    description: 'Card elegante para controlar o Music Assistant',
    preview: true,
    documentationURL: 'https://github.com/soundflow-dev/soundflow-card'
  });
}

console.info(
  `%c SoundFlow Card %c v${VERSION} `,
  'color:white;background:linear-gradient(135deg,#EA3572,#7B3FE4);padding:2px 6px;border-radius:4px 0 0 4px;font-weight:600;',
  'color:#7B3FE4;background:#1a1320;padding:2px 6px;border-radius:0 4px 4px 0;'
);

})();
