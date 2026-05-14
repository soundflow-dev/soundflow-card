export const SF_GRADIENT = 'linear-gradient(135deg, #EA3572 0%, #C729C7 50%, #7B3FE4 100%)';
export const SF_GRADIENT_SOFT = 'linear-gradient(135deg, rgba(234,53,114,0.18) 0%, rgba(199,41,199,0.18) 50%, rgba(123,63,228,0.18) 100%)';

export const CSS = `
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
.sf-section-count { color: var(--sf-text-dim); font-weight: 400; text-transform: none; letter-spacing: 0; font-size: 12px; }
.sf-li-icon-tinted { background: ${SF_GRADIENT}; display: flex; align-items: center; justify-content: center; }
.sf-li-icon-tinted svg { fill: white; }
.sf-li-add {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%;
  margin-right: 6px; flex-shrink: 0;
  background: var(--sf-track); color: var(--sf-text);
  cursor: pointer; transition: background .12s ease, transform .08s ease;
}
.sf-li-add:hover { background: ${SF_GRADIENT}; }
.sf-li-add:hover svg { fill: white; }
.sf-li-add:active { transform: scale(0.92); }
.sf-li-add svg { fill: var(--sf-text); width: 16px; height: 16px; }
.sf-modal-add-row { display: flex; justify-content: center; margin: 6px 0 10px; }
.sf-btn-add-track {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 18px;
  background: var(--sf-track); color: var(--sf-text);
  border: 0; cursor: pointer; font-size: 13px; font-weight: 600;
  transition: background .12s ease, transform .08s ease;
}
.sf-btn-add-track:hover { background: ${SF_GRADIENT}; color: white; }
.sf-btn-add-track:hover svg { fill: white; }
.sf-btn-add-track:active { transform: scale(0.97); }
.sf-btn-add-track svg { fill: var(--sf-text); }

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
