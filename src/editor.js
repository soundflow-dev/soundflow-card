import { CSS } from './styles.js';
import { t } from './i18n.js';
import { applyTheme } from './theme.js';
import * as MA from './api/ma.js';

export class SoundFlowCardEditor extends HTMLElement {
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
    const players = this._hass ? MA.listMassPlayers(this._hass) : [];
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
