// soundflow-card.js - Card SoundFlow consolidado
// Versão: 0.1.0 | Licença: MIT

import './editor.js';
import { SOUNDFLOW_STYLES, ICONS } from './styles.js';
import { getProviderDef, PROVIDER_SVGS } from './providers.js';
import {
  findMaConfigEntryId,
  getMaPlayers,
  getActivePlayer,
  getMaProviders,
  filterMusicProviders,
  equalizeVolumes,
  adjustVolume,
  toggleMute,
  groupPlayers,
  unjoinPlayer,
  maSearch,
  maGetLibrary,
} from './ma-api.js';

const CARD_VERSION = '0.1.0';

console.info(
  `%c SOUNDFLOW-CARD %c ${CARD_VERSION} `,
  'color: white; background: linear-gradient(90deg,#EA3572,#7B3FE4); font-weight: 700; padding: 2px 6px; border-radius: 3px 0 0 3px;',
  'color: #EA3572; background: rgba(234,53,114,0.1); font-weight: 600; padding: 2px 6px; border-radius: 0 3px 3px 0;'
);

class SoundFlowCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this._config = {};
    this._hass = null;
    this._players = [];
    this._activePlayer = null;
    this._maConfigEntryId = null;
    this._providers = [];
    this._selectedSource = null;
    this._selectedSpeakers = [];
    this._modalOpen = false;
    this._popup = null;
    this._sourceDetailContext = null;
    this._popupData = null;
    this._searchQuery = '';
    this._searchResults = null;
    this._searchInProgress = false;
    this._searchDebounce = null;
    this._equalizeLevel = 0.02;

    // Anti-flicker: hash do último estado renderizado
    this._lastRenderHash = null;
    this._modalLastRenderHash = null;

    this._renderInitial();
  }

  // ============================================================
  // LOVELACE LIFECYCLE
  // ============================================================

  setConfig(config) {
    if (!config) throw new Error('Configuração inválida');
    this._config = {
      title: config.title || '',
      default_player: config.default_player || null,
      players: Array.isArray(config.players) ? config.players : null,
      equalize_volume:
        typeof config.equalize_volume === 'number' ? config.equalize_volume : 2,
      hide_radio_search:
        config.hide_radio_search !== undefined ? config.hide_radio_search : true,
    };
    this._equalizeLevel = (this._config.equalize_volume || 2) / 100;
    this._update();
  }

  set hass(hass) {
    const isFirst = !this._hass;
    this._hass = hass;
    this._refreshPlayers();
    if (isFirst) this._initialize();
    else this._update();
  }

  getCardSize() { return 2; }

  static getConfigElement() {
    return document.createElement('soundflow-card-editor');
  }

  static getStubConfig() {
    return { equalize_volume: 2, hide_radio_search: true };
  }

  // ============================================================
  // INITIALIZATION & DATA
  // ============================================================

  async _initialize() {
    if (!this._hass) return;
    try {
      this._maConfigEntryId = await findMaConfigEntryId(this._hass);
      if (this._maConfigEntryId) await this._loadProviders();
    } catch (e) {
      console.warn('[SoundFlow] Init failed:', e);
    }
    this._update();
  }

  async _loadProviders() {
    try {
      const all = await getMaProviders(this._hass, this._maConfigEntryId);
      this._providers = filterMusicProviders(all);
    } catch (e) {
      console.warn('[SoundFlow] Providers failed:', e);
    }
  }

  _refreshPlayers() {
    if (!this._hass) return;
    let players = getMaPlayers(this._hass);
    if (this._config.players && this._config.players.length > 0) {
      players = players.filter((p) => this._config.players.includes(p.entity_id));
    }
    this._players = players;
    if (
      !this._activePlayer ||
      !this._players.find((p) => p.entity_id === this._activePlayer.entity_id)
    ) {
      this._activePlayer = getActivePlayer(
        this._hass,
        this._players,
        this._config.default_player
      );
    } else {
      const found = this._players.find((p) => p.entity_id === this._activePlayer.entity_id);
      if (found) this._activePlayer = found;
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  _esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  _cleanName(name) {
    return (name || '').replace(/\s*\(MA\)\s*/i, '').trim();
  }

  _formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  _getEffectiveSpeakers() {
    if (this._selectedSpeakers.length === 0 && this._activePlayer) {
      return [this._activePlayer.entity_id];
    }
    return this._selectedSpeakers;
  }

  _getSpeakerLabel() {
    const ids = this._getEffectiveSpeakers();
    if (ids.length === 0) return 'Nenhuma';
    if (ids.length === this._players.length && ids.length > 1) return 'Toda a casa';
    return ids
      .map((id) => {
        const p = this._players.find((x) => x.entity_id === id);
        return p ? this._cleanName(p.friendly_name) : id;
      })
      .join(' · ');
  }

  _isRadioMode() {
    if (!this._selectedSource) return false;
    return (
      this._selectedSource.kind === 'radios' ||
      this._selectedSource.kind === 'radio-station'
    );
  }

  _toggleSpeaker(entityId) {
    if (this._selectedSpeakers.includes(entityId)) {
      this._selectedSpeakers = this._selectedSpeakers.filter((id) => id !== entityId);
    } else {
      this._selectedSpeakers = [...this._selectedSpeakers, entityId];
    }
  }

  _selectAllSpeakers() {
    if (this._selectedSpeakers.length === this._players.length) {
      this._selectedSpeakers = [];
    } else {
      this._selectedSpeakers = this._players.map((p) => p.entity_id);
    }
  }

  _renderProviderIcon(def, size = 14) {
    if (!def || def.icon === 'music' || !def.icon) {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="white">${PROVIDER_SVGS.music}</svg>`;
    }
    if (def.iconStroke) {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${PROVIDER_SVGS[def.icon] || PROVIDER_SVGS.music}</svg>`;
    }
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="white">${PROVIDER_SVGS[def.icon] || PROVIDER_SVGS.music}</svg>`;
  }

  // Mini-logo do SoundFlow (a onda do logo principal) usado em listas de favoritos
  _renderSfWave(size = 14, color = 'white') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round">
      <path d="M 4 14 Q 8 9, 12 12 T 20 11"/>
      <circle cx="4" cy="14" r="1.2" fill="${color}" stroke="none"/>
      <circle cx="20" cy="11" r="1.2" fill="${color}" stroke="none"/>
    </svg>`;
  }

  _renderSourceIcon(source, size) {
    if (!source) return '';
    if (source.kind === 'provider' || source.kind === 'provider-tracks' || source.kind === 'provider-playlist' || source.kind === 'item') {
      const def = getProviderDef(source.domain);
      return this._renderProviderIcon(def, size);
    }
    if (source.kind === 'radios' || source.kind === 'radio-station') {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${PROVIDER_SVGS.radio}</svg>`;
    }
    if (source.kind === 'favorites') {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="white">${ICONS.star}</svg>`;
    }
    return '';
  }

  // ============================================================
  // INITIAL RENDER STRUCTURE
  // ============================================================

  _renderInitial() {
    const style = document.createElement('style');
    style.textContent = SOUNDFLOW_STYLES + `
      :host { display: block; }
      ha-card {
        background: var(--card-background-color);
        border-radius: 18px;
        padding: 14px;
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.2s;
        overflow: hidden;
      }
      ha-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
      ha-card:active { transform: scale(0.995); }
      .sf-mini { display: flex; align-items: center; gap: 12px; }
      .sf-mini-art {
        width: 56px; height: 56px; border-radius: 12px;
        background: var(--sf-grad);
        flex-shrink: 0; overflow: hidden; position: relative;
      }
      .sf-mini-art img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .sf-mini-info { flex: 1; min-width: 0; }
      .sf-mini-title {
        font-size: 14px; font-weight: 500; color: var(--sf-text);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .sf-mini-subtitle {
        font-size: 12px; color: var(--sf-text-2);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .sf-mini-controls { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
      .sf-mini-controls .sf-icon-btn { width: 48px; height: 48px; }
      .sf-mini-progress { height: 2px; margin-top: 12px; }
      .sf-empty-state {
        padding: 14px;
        display: flex; flex-direction: column; align-items: center; gap: 12px;
        color: var(--sf-text-3); text-align: center;
      }
    `;

    const wrapper = document.createElement('div');
    wrapper.id = 'sf-root';

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(wrapper);

    // BARREIRA DE EVENTOS DE TECLADO:
    // O HA tem keyboard shortcuts globais (e=edit, c=Assist, m=menu, etc).
    // Quando escrevemos num input dentro do nosso shadow root, queremos que
    // os eventos de teclado NÃO escapem para o HA. Adicionamos listeners
    // a nível do shadow root que param propagação para qualquer keydown/keyup/keypress.
    const stopKb = (e) => {
      // Só parar quando o foco está num input/textarea nosso
      const target = e.composedPath ? e.composedPath()[0] : e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        e.stopPropagation();
      }
    };
    this.shadowRoot.addEventListener('keydown', stopKb, true);
    this.shadowRoot.addEventListener('keyup', stopKb, true);
    this.shadowRoot.addEventListener('keypress', stopKb, true);
  }

  _computeRenderHash() {
    // Hash mínimo do que importa para o render do mini player
    const p = this._activePlayer;
    if (!p) return 'empty:' + this._players.length;
    const a = p.attributes || {};
    return [
      this._players.length,
      p.entity_id,
      p.state,
      a.media_title || '',
      a.media_artist || '',
      a.entity_picture_local || a.entity_picture || '',
      a.media_duration || 0,
      // Não incluir media_position para evitar render a cada segundo;
      // a barra de progresso é atualizada por uma estratégia separada
    ].join('|');
  }

  _computeModalHash() {
    const p = this._activePlayer;
    if (!p) return 'none';
    const a = p.attributes || {};
    return [
      p.entity_id, p.state,
      a.media_title || '', a.media_artist || '', a.media_album_name || '',
      a.entity_picture_local || a.entity_picture || '',
      a.shuffle, a.repeat,
      a.volume_level || 0, a.is_volume_muted ? 1 : 0,
      this._selectedSource ? this._selectedSource.label : '',
      this._selectedSpeakers.join(','),
      this._searchQuery,
    ].join('|');
  }

  _update() {
    if (!this.shadowRoot) return;
    const root = this.shadowRoot.getElementById('sf-root');
    if (!root) return;
    if (!this._hass) { root.innerHTML = ''; return; }

    const hash = this._computeRenderHash();
    if (hash !== this._lastRenderHash) {
      this._lastRenderHash = hash;
      if (this._players.length === 0) {
        root.innerHTML = this._renderEmptyState();
      } else {
        root.innerHTML = this._renderMiniPlayer();
        this._attachMiniListeners(root);
      }
    } else {
      // Apenas atualizar barra de progresso (não recria DOM)
      this._updateProgressOnly(root);
    }

    if (this._modalOpen) {
      const mhash = this._computeModalHash();
      if (mhash !== this._modalLastRenderHash) {
        this._modalLastRenderHash = mhash;
        this._renderModal();
      }
    }
  }

  _updateProgressOnly(root) {
    const p = this._activePlayer;
    if (!p) return;
    const attrs = p.attributes || {};
    if (!attrs.media_duration || attrs.media_position === undefined) return;
    const fill = root.querySelector('.sf-mini-progress .sf-progress-fill');
    if (!fill) return;
    const isPlaying = p.state === 'playing';
    const ref = attrs.media_position_updated_at || new Date().toISOString();
    const elapsed = attrs.media_position +
      (isPlaying ? Math.max(0, (Date.now() - new Date(ref).getTime()) / 1000) : 0);
    const pct = Math.max(0, Math.min(100, (elapsed / attrs.media_duration) * 100));
    fill.style.width = pct + '%';
  }

  // ============================================================
  // MINI PLAYER
  // ============================================================

  _renderEmptyState() {
    return `
      <ha-card>
        <div class="sf-empty-state">
          <div style="width:64px;height:64px;border-radius:14px;overflow:hidden;">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;">
              <defs>
                <linearGradient id="sflogo-empty" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#EA3572"/>
                  <stop offset="50%" stop-color="#C729C7"/>
                  <stop offset="100%" stop-color="#7B3FE4"/>
                </linearGradient>
              </defs>
              <rect width="100" height="100" rx="22" fill="url(#sflogo-empty)"/>
              <path d="M 22 56 Q 36 36, 50 50 T 78 46" fill="none" stroke="white" stroke-width="4.5" stroke-linecap="round" opacity="0.95"/>
              <circle cx="22" cy="56" r="4" fill="white"/>
              <circle cx="78" cy="46" r="4" fill="white"/>
            </svg>
          </div>
          <div style="font-size:13px;">
            <div style="font-size:15px;font-weight:600;color:var(--sf-text);margin-bottom:6px;">SoundFlow</div>
            Nenhum player do Music Assistant detetado.<br>
            <small>Verifica se o Music Assistant está instalado e configurado.</small>
          </div>
        </div>
      </ha-card>
    `;
  }

  _renderMiniPlayer() {
    const p = this._activePlayer;
    if (!p) return this._renderEmptyState();

    const attrs = p.attributes || {};
    const title = attrs.media_title || 'Sem reprodução';
    const artist = attrs.media_artist || '';
    const room = this._cleanName(p.friendly_name);
    const subtitle = artist ? `${artist} · ${room}` : room;
    const isPlaying = p.state === 'playing';
    const playIconSvg = isPlaying ? ICONS.pause : ICONS.play;

    const artUrl = attrs.entity_picture_local || attrs.entity_picture || null;
    const artHtml = artUrl
      ? `<img src="${this._esc(artUrl)}" alt="" onerror="this.style.display='none'">`
      : `<svg viewBox="0 0 56 56" style="position:absolute;inset:0;width:100%;height:100%;">
          <path d="M 12 32 Q 20 22, 28 28 T 44 26" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>
          <circle cx="12" cy="32" r="2.5" fill="white"/>
          <circle cx="44" cy="26" r="2.5" fill="white"/>
        </svg>`;

    let progressHtml = '';
    if (attrs.media_duration && attrs.media_position !== undefined && attrs.media_duration > 0) {
      const ref = attrs.media_position_updated_at || new Date().toISOString();
      const elapsed = attrs.media_position +
        (isPlaying ? Math.max(0, (Date.now() - new Date(ref).getTime()) / 1000) : 0);
      const pct = Math.max(0, Math.min(100, (elapsed / attrs.media_duration) * 100));
      progressHtml = `
        <div class="sf-progress sf-mini-progress">
          <div class="sf-progress-fill" style="width:${pct}%"></div>
        </div>
      `;
    }

    return `
      <ha-card>
        <div class="sf-mini" data-action="open-modal">
          <div class="sf-mini-art">${artHtml}</div>
          <div class="sf-mini-info">
            <div class="sf-mini-title">${this._esc(title)}</div>
            <div class="sf-mini-subtitle">${this._esc(subtitle)}</div>
          </div>
          <div class="sf-mini-controls" data-stop="1">
            <button class="sf-icon-btn sf-circle" data-action="prev" title="Anterior">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">${ICONS.prev}</svg>
            </button>
            <button class="sf-icon-btn sf-grad" data-action="play-pause" title="Play/Pause">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">${playIconSvg}</svg>
            </button>
            <button class="sf-icon-btn sf-circle" data-action="next" title="Próximo">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">${ICONS.next}</svg>
            </button>
          </div>
        </div>
        ${progressHtml}
      </ha-card>
    `;
  }

  _attachMiniListeners(root) {
    const stopEl = root.querySelector('[data-stop]');
    if (stopEl) stopEl.addEventListener('click', (e) => e.stopPropagation());
    root.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this._handleMiniAction(el.dataset.action);
      });
    });
  }

  _handleMiniAction(action) {
    if (!this._activePlayer) return;
    const id = this._activePlayer.entity_id;
    switch (action) {
      case 'open-modal': this._openModal(); break;
      case 'play-pause': this._hass.callService('media_player', 'media_play_pause', {}, { entity_id: id }); break;
      case 'prev': this._hass.callService('media_player', 'media_previous_track', {}, { entity_id: id }); break;
      case 'next': this._hass.callService('media_player', 'media_next_track', {}, { entity_id: id }); break;
    }
  }

  // ============================================================
  // MODAL
  // ============================================================

  _openModal() {
    this._modalOpen = true;
    this._popup = null;
    this._renderModal();
  }

  _closeModal() {
    this._modalOpen = false;
    this._popup = null;
    const overlay = this.shadowRoot.querySelector('.sf-modal-overlay');
    if (overlay) overlay.remove();
    const popup = this.shadowRoot.querySelector('.sf-popup-overlay');
    if (popup) popup.remove();
  }

  _renderModal() {
    const existing = this.shadowRoot.querySelector('.sf-modal-overlay:not(.sf-popup-overlay)');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'sf-modal-overlay';
    overlay.innerHTML = `<div class="sf-modal" id="sf-modal-content">${this._renderModalBody()}</div>`;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._closeModal();
    });
    this.shadowRoot.appendChild(overlay);
    this._attachModalListeners(overlay);
    if (this._popup) this._renderPopup();
  }

  _renderModalBody() {
    const p = this._activePlayer;
    if (!p) return '<div class="sf-empty">Sem player ativo</div>';

    const attrs = p.attributes || {};
    const title = attrs.media_title || 'Sem reprodução';
    const artist = attrs.media_artist || '';
    const album = attrs.media_album_name || '';
    const isPlaying = p.state === 'playing';
    const isRadio = this._isRadioMode();

    const artUrl = attrs.entity_picture_local || attrs.entity_picture || null;
    const artHtml = artUrl
      ? `<img src="${this._esc(artUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:20px;" onerror="this.style.display='none'">`
      : `<div style="width:100%;height:100%;background:var(--sf-grad);border-radius:20px;position:relative;overflow:hidden;">
          <svg viewBox="0 0 180 180" style="position:absolute;inset:0;width:100%;height:100%;">
            <path d="M 40 105 Q 70 75, 95 92 T 145 85" fill="none" stroke="white" stroke-width="6" stroke-linecap="round" opacity="0.9"/>
            <circle cx="40" cy="105" r="6" fill="white"/>
            <circle cx="145" cy="85" r="6" fill="white"/>
          </svg>
        </div>`;

    const playerName = this._cleanName(p.friendly_name);
    const sourceLabel = this._selectedSource ? this._selectedSource.label : 'Escolher fonte…';
    const sourceIcon = this._selectedSource
      ? this._renderSourceIcon(this._selectedSource, 17)
      : `<svg width="17" height="17" viewBox="0 0 24 24" fill="white">${PROVIDER_SVGS.music}</svg>`;
    const sourceBg = this._selectedSource && this._selectedSource.gradient
      ? this._selectedSource.gradient
      : 'var(--sf-grad)';
    const speakerLabel = this._getSpeakerLabel();

    const speakers = this._getEffectiveSpeakers();
    let avgVolume = 0;
    let allMuted = true;
    if (speakers.length > 0) {
      const vols = speakers.map((id) => this._hass.states[id]).filter(Boolean).map((s) => s.attributes);
      if (vols.length > 0) {
        avgVolume = vols.reduce((sum, a) => sum + (a.volume_level || 0), 0) / vols.length;
        allMuted = vols.every((a) => a.is_volume_muted);
      } else {
        allMuted = false;
      }
    }
    const volPct = Math.round(avgVolume * 100);

    let progressBar = '';
    if (attrs.media_duration && attrs.media_position !== undefined && attrs.media_duration > 0) {
      const ref = attrs.media_position_updated_at || new Date().toISOString();
      const elapsed = attrs.media_position +
        (isPlaying ? Math.max(0, (Date.now() - new Date(ref).getTime()) / 1000) : 0);
      const pct = Math.max(0, Math.min(100, (elapsed / attrs.media_duration) * 100));
      progressBar = `
        <div class="sf-progress" style="margin-bottom:6px;">
          <div class="sf-progress-fill" style="width:${pct}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--sf-text-3);margin-bottom:18px;">
          <span>${this._formatTime(elapsed)}</span>
          <span>${this._formatTime(attrs.media_duration)}</span>
        </div>
      `;
    }

    const searchBarHtml = isRadio ? '' : `
      <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--sf-button-bg);border:1px solid var(--sf-border);border-radius:14px;margin-bottom:14px;cursor:text;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sf-text-3)" stroke-width="2">${ICONS.search}</svg>
        <input
          type="text"
          placeholder="Pesquisar música, artista, álbum…"
          value="${this._esc(this._searchQuery || '')}"
          style="flex:1;background:transparent;border:none;color:var(--sf-text);font-size:13px;outline:none;font-family:inherit;"
          data-action="search-input">
      </div>
    `;

    const muteIcon = allMuted ? ICONS.mute : ICONS.volume;
    const muteTitle = allMuted ? 'Desmutar' : 'Silenciar';

    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <button class="sf-pill" data-action="select-player" title="Mudar player">
          <span class="sf-dot"></span>
          <span>${this._esc(playerName)}</span>
          <svg width="13" height="13" viewBox="0 0 24 24">${ICONS.chevron_down}</svg>
        </button>
        <button class="sf-icon-btn sf-circle" style="width:48px;height:48px;" data-action="open-settings" title="Definições">
          <svg width="28" height="28" viewBox="0 0 24 24">${ICONS.settings}</svg>
        </button>
      </div>

      <div style="text-align:center;margin-bottom:18px;">
        <div style="width:180px;height:180px;margin:0 auto 16px;border-radius:20px;overflow:hidden;box-shadow:0 16px 40px -16px rgba(234,53,114,0.5);">
          ${artHtml}
        </div>
        <div style="font-size:20px;font-weight:500;margin-bottom:4px;">${this._esc(title)}</div>
        ${artist ? `<div style="font-size:14px;color:var(--sf-text-2);">${this._esc(artist)}</div>` : ''}
        ${album ? `<div style="font-size:12px;color:var(--sf-text-3);">${this._esc(album)}</div>` : ''}
      </div>

      ${progressBar}

      <div style="display:flex;justify-content:center;gap:14px;margin-bottom:24px;align-items:center;">
        <button class="sf-icon-btn sf-ghost" style="width:52px;height:52px;border-radius:50%;${attrs.shuffle ? 'color:var(--sf-pink)' : ''}" data-action="shuffle" title="Aleatório">
          <svg width="32" height="32" viewBox="0 0 24 24">${ICONS.shuffle}</svg>
        </button>
        <button class="sf-icon-btn sf-circle" style="width:52px;height:52px;" data-action="prev" title="Anterior">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">${ICONS.prev}</svg>
        </button>
        <button class="sf-icon-btn sf-grad" style="width:72px;height:72px;border-radius:50%;" data-action="play-pause" title="Play/Pause">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="white">${isPlaying ? ICONS.pause : ICONS.play}</svg>
        </button>
        <button class="sf-icon-btn sf-circle" style="width:52px;height:52px;" data-action="next" title="Próximo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">${ICONS.next}</svg>
        </button>
        <button class="sf-icon-btn sf-ghost" style="width:52px;height:52px;border-radius:50%;${attrs.repeat && attrs.repeat !== 'off' ? 'color:var(--sf-pink)' : ''}" data-action="repeat" title="Repetir">
          <svg width="32" height="32" viewBox="0 0 24 24">${ICONS.repeat}</svg>
        </button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
        <button class="sf-source-btn" data-action="open-source" style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--sf-button-bg);border:1px solid var(--sf-border);border-radius:14px;color:var(--sf-text);min-width:0;cursor:pointer;font-family:inherit;">
          <div style="width:32px;height:32px;border-radius:8px;background:${sourceBg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${sourceIcon}
          </div>
          <div style="flex:1;min-width:0;text-align:left;">
            <div style="font-size:11px;color:var(--sf-text-3);line-height:1.2;">Fonte</div>
            <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this._esc(sourceLabel)}</div>
          </div>
        </button>
        <button class="sf-speakers-btn" data-action="open-speakers" style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--sf-button-bg);border:1px solid var(--sf-border);border-radius:14px;color:var(--sf-text);min-width:0;cursor:pointer;font-family:inherit;">
          <div style="width:32px;height:32px;border-radius:8px;background:rgba(123,63,228,0.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="17" height="17" viewBox="0 0 24 24">${ICONS.speaker}</svg>
          </div>
          <div style="flex:1;min-width:0;text-align:left;">
            <div style="font-size:11px;color:var(--sf-text-3);line-height:1.2;">Colunas</div>
            <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this._esc(speakerLabel)}</div>
          </div>
        </button>
      </div>

      ${searchBarHtml}

      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">
        <button class="sf-icon-btn sf-circle" style="width:48px;height:48px;flex-shrink:0;" data-action="vol-down" title="Volume −">
          <svg width="28" height="28" viewBox="0 0 24 24">${ICONS.minus}</svg>
        </button>
        <div class="sf-vol-bar" style="flex:1;" data-action="vol-set">
          <div class="sf-vol-fill" style="width:${volPct}%"></div>
        </div>
        <button class="sf-icon-btn sf-circle" style="width:48px;height:48px;flex-shrink:0;" data-action="vol-up" title="Volume +">
          <svg width="28" height="28" viewBox="0 0 24 24">${ICONS.plus}</svg>
        </button>
        <button class="sf-icon-btn sf-circle" style="width:48px;height:48px;flex-shrink:0;${allMuted ? 'color:var(--sf-pink)' : ''}" data-action="mute" title="${muteTitle}">
          <svg width="28" height="28" viewBox="0 0 24 24">${muteIcon}</svg>
        </button>
      </div>
      <div style="display:flex;justify-content:flex-end;">
        <button class="sf-equalize" data-action="equalize">Igualar volume → ${this._config.equalize_volume}%</button>
      </div>
    `;
  }

  _attachModalListeners(overlay) {
    overlay.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this._handleModalAction(el.dataset.action, e, el);
      });
    });

    const searchInput = overlay.querySelector('[data-action="search-input"]');
    if (searchInput) {
      searchInput.addEventListener('click', (e) => e.stopPropagation());
      searchInput.addEventListener('input', (e) => {
        this._searchQuery = e.target.value;
        this._scheduleSearch();
      });
      searchInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          this._searchQuery = '';
          this._searchResults = null;
          if (this._popup === 'search-results') {
            this._popup = null;
            this._renderPopup();
          }
        }
      });
    }

    const volBar = overlay.querySelector('[data-action="vol-set"]');
    if (volBar) {
      volBar.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = volBar.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this._setVolume(pct);
      });
    }
  }

  async _handleModalAction(action, event, element) {
    if (!this._activePlayer) return;
    const id = this._activePlayer.entity_id;

    switch (action) {
      case 'play-pause':
        this._hass.callService('media_player', 'media_play_pause', {}, { entity_id: id }); break;
      case 'prev':
        this._hass.callService('media_player', 'media_previous_track', {}, { entity_id: id }); break;
      case 'next':
        this._hass.callService('media_player', 'media_next_track', {}, { entity_id: id }); break;
      case 'shuffle': {
        const cur = this._activePlayer.attributes.shuffle || false;
        this._hass.callService('media_player', 'shuffle_set', { shuffle: !cur }, { entity_id: id });
        break;
      }
      case 'repeat': {
        const cur = this._activePlayer.attributes.repeat || 'off';
        const next = cur === 'off' ? 'all' : cur === 'all' ? 'one' : 'off';
        this._hass.callService('media_player', 'repeat_set', { repeat: next }, { entity_id: id });
        break;
      }
      case 'vol-up':
        adjustVolume(this._hass, this._getEffectiveSpeakers(), 0.05); break;
      case 'vol-down':
        adjustVolume(this._hass, this._getEffectiveSpeakers(), -0.05); break;
      case 'mute':
        toggleMute(this._hass, this._getEffectiveSpeakers()); break;
      case 'equalize':
        equalizeVolumes(this._hass, this._getEffectiveSpeakers(), this._equalizeLevel); break;
      case 'open-source':
        this._popup = 'source'; this._renderPopup(); break;
      case 'open-speakers':
        this._popup = 'speakers'; this._renderPopup(); break;
      case 'open-settings':
        this._popup = 'settings'; this._renderPopup(); break;
      case 'select-player':
        // Popup unificado Player + Colunas
        this._popup = 'speakers'; this._renderPopup(); break;
      case 'close-modal':
        this._closeModal(); break;
    }
  }

  _setVolume(level) {
    const ids = this._getEffectiveSpeakers();
    const promises = ids.map((id) =>
      this._hass.callService('media_player', 'volume_set', { volume_level: level }, { entity_id: id })
    );
    return Promise.all(promises);
  }

  // ============================================================
  // POPUPS
  // ============================================================

  _renderPopup() {
    const existing = this.shadowRoot.querySelector('.sf-popup-overlay');
    if (existing) existing.remove();
    if (!this._popup) return;

    const popup = document.createElement('div');
    popup.className = 'sf-modal-overlay sf-popup-overlay';
    popup.style.zIndex = '10000';
    popup.innerHTML = `<div class="sf-popup">${this._renderPopupBody()}</div>`;
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        this._popup = null;
        popup.remove();
      }
    });
    this.shadowRoot.appendChild(popup);
    this._attachPopupListeners(popup);
  }

  _renderPopupBody() {
    switch (this._popup) {
      case 'source': return this._renderSourcePopup();
      case 'source-detail': return this._renderSourceDetailPopup();
      case 'source-playlists': return this._renderSourcePlaylistsPopup();
      case 'source-radios': return this._renderSourceRadiosPopup();
      case 'source-favorites': return this._renderSourceFavoritesPopup();
      case 'source-favorites-category': return this._renderSourceFavoritesCategoryPopup();
      case 'speakers': return this._renderSpeakersPopup();
      case 'settings': return this._renderSettingsPopup();
      case 'search-results': return this._renderSearchResultsPopup();
      default: return '';
    }
  }

  _attachPopupListeners(overlay) {
    overlay.querySelectorAll('[data-action]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this._handlePopupAction(el.dataset.action, el);
      });
    });

    overlay.querySelectorAll('.sf-vol-bar[data-speaker]').forEach((bar) => {
      bar.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = bar.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const sid = bar.dataset.speaker;
        this._hass.callService('media_player', 'volume_set', { volume_level: pct }, { entity_id: sid });
      });
    });
  }

  async _handlePopupAction(action, element) {
    switch (action) {
      case 'close-popup':
        this._popup = null; this._renderPopup(); break;

      case 'reload-providers':
        this._providers = [];
        this._renderPopup();
        try {
          await this._loadProviders();
        } catch (e) { /* ignore */ }
        this._renderPopup();
        break;

      case 'edit-card': {
        // Dispara evento HA standard para abrir o editor visual deste card
        const ev = new CustomEvent('show-edit-card', {
          bubbles: true,
          composed: true,
          detail: { /* card index é resolvido pelo HA via event composition */ },
        });
        this.dispatchEvent(ev);
        // Em alternativa, alguns dashboards respondem a hass-edit-mode:
        const fallback = new CustomEvent('hass-edit-mode', { bubbles: true, composed: true });
        this.dispatchEvent(fallback);
        this._popup = null;
        this._renderPopup();
        break;
      }

      case 'select-source-provider': {
        this._sourceDetailContext = {
          kind: 'provider',
          instance_id: element.dataset.instanceId,
          domain: element.dataset.domain,
          name: element.dataset.name,
          gradient: element.dataset.gradient,
        };
        this._popup = 'source-detail';
        this._renderPopup();
        break;
      }
      case 'select-source-radios':
        this._sourceDetailContext = { kind: 'radios' };
        this._popup = 'source-radios';
        await this._loadRadios();
        break;
      case 'select-source-favorites':
        this._sourceDetailContext = { kind: 'favorites' };
        this._popup = 'source-favorites';
        await this._loadFavorites();
        break;
      case 'open-favorites-category': {
        const cat = element.dataset.category;
        this._popup = 'source-favorites-category';
        await this._loadFavoritesCategory(cat);
        break;
      }
      case 'open-source':
        this._popup = 'source'; this._renderPopup(); break;

      case 'play-source-tracks': {
        const ctx = this._sourceDetailContext;
        this._selectedSource = {
          kind: 'provider-tracks',
          instance_id: ctx.instance_id,
          domain: ctx.domain,
          name: ctx.name,
          label: `${getProviderDef(ctx.domain).name} · ${ctx.name}`,
          gradient: ctx.gradient,
        };
        await this._playProviderTracks(ctx);
        this._popup = null;
        this._renderPopup();
        this._renderModal();
        break;
      }
      case 'open-source-playlists':
        this._popup = 'source-playlists';
        await this._loadProviderPlaylists();
        break;

      case 'play-item': {
        const uri = element.dataset.uri;
        const mediaType = element.dataset.mediaType;
        const name = element.dataset.name;
        await this._playSelectedItem(uri, mediaType, name);
        this._popup = null;
        this._renderPopup();
        this._renderModal();
        break;
      }

      case 'toggle-speaker':
        this._toggleSpeaker(element.dataset.entityId);
        this._renderPopup();
        this._renderModal();
        break;
      case 'select-all-speakers':
        this._selectAllSpeakers();
        this._renderPopup();
        this._renderModal();
        break;
      case 'speaker-vol-up':
        adjustVolume(this._hass, [element.dataset.entityId], 0.05); break;
      case 'speaker-vol-down':
        adjustVolume(this._hass, [element.dataset.entityId], -0.05); break;
      case 'equalize-popup':
        equalizeVolumes(this._hass, this._getEffectiveSpeakers(), this._equalizeLevel); break;

      case 'apply-grouping': {
        const ids = this._selectedSpeakers;
        if (ids.length < 2) {
          // sem o que agrupar; pode ser 1 (sem efeito) ou 0
          break;
        }
        const leader = (this._activePlayer && ids.includes(this._activePlayer.entity_id))
          ? this._activePlayer.entity_id
          : ids[0];
        try {
          await groupPlayers(this._hass, leader, ids);
          // Se o leader não era o activePlayer, passa a ser
          if (!this._activePlayer || this._activePlayer.entity_id !== leader) {
            this._activePlayer = this._players.find((p) => p.entity_id === leader) || this._activePlayer;
          }
        } catch (e) {
          console.warn('[SoundFlow] Group failed:', e);
        }
        this._renderPopup();
        this._renderModal();
        break;
      }

      case 'ungroup-all': {
        // Desagrupar todos os players actualmente agrupados
        const tasks = [];
        for (const p of this._players) {
          const stateObj = this._hass.states[p.entity_id];
          const members = stateObj && stateObj.attributes.group_members;
          if (Array.isArray(members) && members.length > 1) {
            tasks.push(unjoinPlayer(this._hass, p.entity_id).catch(() => {}));
          }
        }
        try { await Promise.all(tasks); } catch (e) { /* ignore */ }
        this._renderPopup();
        this._renderModal();
        break;
      }

      case 'set-active-player':
        this._activePlayer = this._players.find((p) => p.entity_id === element.dataset.entityId);
        // Não fechar o popup — fica aberto para configurar grouping/volumes
        this._renderPopup();
        this._renderModal();
        break;
    }
  }

  // ============================================================
  // SOURCE POPUP
  // ============================================================

  _buildSourceList() {
    const list = [];
    const musicDomains = ['apple_music', 'spotify', 'tidal', 'qobuz', 'deezer',
      'ytmusic', 'youtube_music', 'soundcloud', 'plex', 'jellyfin', 'subsonic',
      'filesystem_smb', 'filesystem_local'];

    for (const p of this._providers) {
      const domain = (p.domain || '').toLowerCase();
      if (!musicDomains.includes(domain)) continue;
      const def = getProviderDef(p.domain);
      list.push({
        type: 'provider',
        instance_id: p.instance_id,
        domain: p.domain,
        name: p.name || def.name,
        def,
        action: 'select-source-provider',
      });
    }

    list.push({
      type: 'radios',
      name: 'Rádios favoritas',
      def: getProviderDef('tunein'),
      action: 'select-source-radios',
    });
    list.push({
      type: 'favorites',
      name: 'Favoritos do Music Assistant',
      def: { name: 'Favoritos', gradient: 'var(--sf-grad)', color: '#C729C7', icon: 'sfwave' },
      action: 'select-source-favorites',
    });

    return list;
  }

  _renderSourcePopup() {
    const items = this._buildSourceList();
    return `
      <div class="sf-popup-header">
        <span class="sf-popup-title">Escolher fonte</span>
        <button class="sf-icon-btn sf-circle" style="width:36px;height:36px;" data-action="close-popup">
          <svg width="20" height="20" viewBox="0 0 24 24">${ICONS.close}</svg>
        </button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${items.length === 0
          ? '<div class="sf-empty">Nenhum provider de música encontrado no Music Assistant.</div>'
          : items.map((item) => this._renderSourceItem(item)).join('')}
      </div>
    `;
  }

  _renderSourceItem(item) {
    const isActive =
      this._selectedSource &&
      ((item.type === 'provider' && this._selectedSource.instance_id === item.instance_id) ||
       this._selectedSource.kind === item.type);

    const iconHtml = item.def && item.def.icon === 'sfwave'
      ? this._renderSfWave(16, 'white')
      : this._renderProviderIcon(item.def, 14);
    const subtitle =
      item.type === 'provider' ? 'Tracks · Playlists' :
      item.type === 'radios' ? 'Estações' :
      'Música marcada como favorita';

    const dataAttrs =
      item.type === 'provider'
        ? `data-instance-id="${this._esc(item.instance_id)}" data-domain="${this._esc(item.domain)}" data-name="${this._esc(item.name)}" data-gradient="${this._esc(item.def.gradient)}"`
        : '';

    const checkOrChevron = isActive
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="var(--sf-pink)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24">${ICONS.chevron_right}</svg>`;

    return `
      <div class="sf-list-item ${isActive ? 'sf-active' : ''}" data-action="${item.action}" ${dataAttrs}>
        <div class="sf-list-item-icon" style="background:${item.def.gradient};">${iconHtml}</div>
        <div class="sf-list-item-content">
          <div class="sf-list-item-title">${this._esc(item.name)}</div>
          <div class="sf-list-item-subtitle">${subtitle}</div>
        </div>
        ${checkOrChevron}
      </div>
    `;
  }

  _renderSourceDetailPopup() {
    const ctx = this._sourceDetailContext || {};
    const def = getProviderDef(ctx.domain);
    return `
      <div class="sf-popup-header">
        <div style="display:flex;align-items:center;gap:12px;">
          <button class="sf-icon-btn sf-circle" style="width:36px;height:36px;" data-action="open-source">
            <svg width="20" height="20" viewBox="0 0 24 24">${ICONS.back}</svg>
          </button>
          <div>
            <div style="font-size:16px;font-weight:500;">${this._esc(def.name)} · ${this._esc(ctx.name || '')}</div>
            <div style="font-size:11px;color:var(--sf-text-3);">Escolher categoria</div>
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div class="sf-list-item" data-action="play-source-tracks">
          <div class="sf-list-item-icon" style="width:42px;height:42px;background:${def.gradient};">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">${PROVIDER_SVGS.music}</svg>
          </div>
          <div class="sf-list-item-content">
            <div class="sf-list-item-title" style="font-size:15px;">Tracks</div>
            <div class="sf-list-item-subtitle">Tocar tudo em modo aleatório</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--sf-pink)">${ICONS.shuffle_play}</svg>
        </div>
        <div class="sf-list-item" data-action="open-source-playlists">
          <div class="sf-list-item-icon" style="width:42px;height:42px;background:rgba(123,63,228,0.25);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a280ff" stroke-width="2" stroke-linecap="round">${ICONS.playlist}</svg>
          </div>
          <div class="sf-list-item-content">
            <div class="sf-list-item-title" style="font-size:15px;">Playlists</div>
            <div class="sf-list-item-subtitle">Escolher uma playlist</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24">${ICONS.chevron_right}</svg>
        </div>
      </div>
    `;
  }

  // ============================================================
  // SPEAKERS POPUP
  // ============================================================

  _renderSpeakersPopup() {
    const total = this._players.length;
    const selected = this._selectedSpeakers.length;
    const allSelected = selected === total && total > 0;
    const allLabel = allSelected ? '✓ Toda a casa selecionada' : 'Selecionar toda a casa';

    // Detetar o estado de agrupamento real do HA
    // Um player está agrupado se group_members tiver mais que ele próprio
    const groupedIds = new Set();
    for (const p of this._players) {
      const stateObj = this._hass.states[p.entity_id];
      if (!stateObj) continue;
      const members = stateObj.attributes.group_members || [];
      if (Array.isArray(members) && members.length > 1) {
        members.forEach((m) => groupedIds.add(m));
      }
    }

    return `
      <div class="sf-popup-header">
        <span class="sf-popup-title">Player & Colunas</span>
        <button class="sf-icon-btn sf-circle" style="width:36px;height:36px;" data-action="close-popup">
          <svg width="20" height="20" viewBox="0 0 24 24">${ICONS.close}</svg>
        </button>
      </div>

      <div style="font-size:11px;color:var(--sf-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">
        Toque na coluna para a tornar principal · ☐ para sincronizar
      </div>

      <button style="width:100%;padding:12px;background:var(--sf-button-bg);border:1px dashed var(--sf-border);border-radius:12px;color:var(--sf-text);font-size:13px;cursor:pointer;margin-bottom:14px;font-family:inherit;" data-action="select-all-speakers">
        ${allLabel}
      </button>

      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;">
        ${this._players.map((p) => this._renderSpeakerRow(p, groupedIds)).join('')}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        <button class="sf-equalize" style="padding:11px;font-size:12px;border-radius:10px;" data-action="apply-grouping">
          ${selected >= 2 ? `Agrupar ${selected} colunas` : 'Agrupar selecionadas'}
        </button>
        <button class="sf-equalize" style="padding:11px;font-size:12px;border-radius:10px;background:var(--sf-button-bg);color:var(--sf-text);border:1px solid var(--sf-border);" data-action="ungroup-all">
          Desagrupar tudo
        </button>
      </div>

      <button class="sf-equalize" style="width:100%;padding:11px;font-size:12px;border-radius:10px;" data-action="equalize-popup">
        Igualar volume → ${this._config.equalize_volume}%
      </button>
    `;
  }

  _renderSpeakerRow(player, groupedIds = new Set()) {
    const isSelected = this._selectedSpeakers.includes(player.entity_id);
    const isActive = this._activePlayer && this._activePlayer.entity_id === player.entity_id;
    const stateObj = this._hass.states[player.entity_id];
    const volPct = stateObj ? Math.round((stateObj.attributes.volume_level || 0) * 100) : 0;
    const name = this._cleanName(player.friendly_name);
    const isGrouped = groupedIds.has(player.entity_id);

    const stateLabel = player.state === 'playing' ? 'A tocar'
      : player.state === 'paused' ? 'Em pausa'
      : player.state === 'idle' ? 'Inativo' : (player.state || '');
    const subtitle = isGrouped ? `${stateLabel} · sincronizado` : stateLabel;

    const checkBoxHtml = isSelected
      ? `<div class="sf-speaker-check" style="background:var(--sf-grad);" data-action="toggle-speaker" data-entity-id="${player.entity_id}">
           <svg width="14" height="14" viewBox="0 0 24 24">${ICONS.check}</svg>
         </div>`
      : `<div class="sf-speaker-check" style="background:transparent;border:1.5px solid var(--sf-text-3);" data-action="toggle-speaker" data-entity-id="${player.entity_id}"></div>`;

    const rowBg = isActive ? 'background:rgba(234,53,114,0.12);border:1px solid rgba(234,53,114,0.45);' : 'background:var(--sf-button-bg);border:1px solid var(--sf-border);';

    return `
      <div style="${rowBg}border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:10px;">
        ${checkBoxHtml}
        <div data-action="set-active-player" data-entity-id="${player.entity_id}" style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;cursor:pointer;">
          <div class="sf-list-item-icon" style="background:rgba(123,63,228,0.25);width:36px;height:36px;flex-shrink:0;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a280ff" stroke-width="2">${ICONS.speaker}</svg>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:500;${isActive ? 'color:var(--sf-pink);' : ''}white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${this._esc(name)}${isActive ? ' <span style="font-size:10px;letter-spacing:0.05em;text-transform:uppercase;opacity:0.85;">· principal</span>' : ''}
            </div>
            <div style="font-size:11px;color:var(--sf-text-3);">${subtitle}</div>
          </div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:8px;padding:0 4px;margin-top:-4px;${isSelected ? '' : 'opacity:0.5;'}">
        <button class="sf-icon-btn sf-circle" style="width:38px;height:38px;flex-shrink:0;" data-action="speaker-vol-down" data-entity-id="${player.entity_id}">
          <svg width="22" height="22" viewBox="0 0 24 24">${ICONS.minus}</svg>
        </button>
        <div class="sf-vol-bar" style="flex:1;" data-speaker="${player.entity_id}">
          <div class="sf-vol-fill" style="width:${volPct}%;${isSelected ? '' : 'background:rgba(255,255,255,0.4);'}"></div>
        </div>
        <span style="font-size:11px;min-width:32px;text-align:right;color:var(--sf-text-2);flex-shrink:0;">${volPct}%</span>
        <button class="sf-icon-btn sf-circle" style="width:38px;height:38px;flex-shrink:0;" data-action="speaker-vol-up" data-entity-id="${player.entity_id}">
          <svg width="22" height="22" viewBox="0 0 24 24">${ICONS.plus}</svg>
        </button>
      </div>
    `;
  }

  // ============================================================
  // SETTINGS POPUP
  // ============================================================

  _renderSettingsPopup() {
    return `
      <div class="sf-popup-header">
        <span class="sf-popup-title">Definições</span>
        <button class="sf-icon-btn sf-circle" style="width:36px;height:36px;" data-action="close-popup">
          <svg width="20" height="20" viewBox="0 0 24 24">${ICONS.close}</svg>
        </button>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;">
        <div>
          <div style="font-size:11px;color:var(--sf-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Sobre</div>
          <div style="display:flex;align-items:center;gap:14px;padding:14px;background:var(--sf-button-bg);border-radius:12px;">
            <div style="width:48px;height:48px;border-radius:12px;overflow:hidden;flex-shrink:0;">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;">
                <defs>
                  <linearGradient id="sflogo-set" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#EA3572"/>
                    <stop offset="50%" stop-color="#C729C7"/>
                    <stop offset="100%" stop-color="#7B3FE4"/>
                  </linearGradient>
                </defs>
                <rect width="100" height="100" rx="22" fill="url(#sflogo-set)"/>
                <path d="M 22 56 Q 36 36, 50 50 T 78 46" fill="none" stroke="white" stroke-width="4.5" stroke-linecap="round" opacity="0.95"/>
                <circle cx="22" cy="56" r="4" fill="white"/>
                <circle cx="78" cy="46" r="4" fill="white"/>
              </svg>
            </div>
            <div>
              <div style="font-size:15px;font-weight:600;">SoundFlow Card</div>
              <div style="font-size:12px;color:var(--sf-text-2);">Versão ${CARD_VERSION}</div>
            </div>
          </div>
        </div>

        <div>
          <div style="font-size:11px;color:var(--sf-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Players visíveis (${this._players.length})</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${this._players.map((p) => `
              <div style="padding:10px 12px;background:var(--sf-button-bg);border:1px solid var(--sf-border);border-radius:10px;font-size:13px;">
                ${this._esc(this._cleanName(p.friendly_name))}
                <div style="font-size:11px;color:var(--sf-text-3);">${this._esc(p.entity_id)}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div>
          <div style="font-size:11px;color:var(--sf-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Providers detectados (${this._providers.length})</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${this._providers.length === 0
              ? '<div style="font-size:12px;color:var(--sf-text-3);">Nenhum provider detectado</div>'
              : this._providers.map((p) => {
                  const def = getProviderDef(p.domain);
                  return `
                    <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--sf-button-bg);border:1px solid var(--sf-border);border-radius:10px;">
                      <div style="width:24px;height:24px;border-radius:6px;background:${def.gradient};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        ${this._renderProviderIcon(def, 12)}
                      </div>
                      <div style="flex:1;min-width:0;">
                        <div style="font-size:12px;font-weight:500;">${this._esc(p.name || def.name)}</div>
                        <div style="font-size:10px;color:var(--sf-text-3);">${this._esc(p.domain || '')}</div>
                      </div>
                    </div>
                  `;
                }).join('')}
          </div>
          <button class="sf-equalize" style="width:100%;margin-top:8px;padding:9px;font-size:11px;border-radius:10px;background:var(--sf-button-bg);color:var(--sf-text);border:1px dashed var(--sf-border);" data-action="reload-providers">
            🔄 Re-detetar providers
          </button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;">
          <button class="sf-equalize" style="padding:11px;font-size:12px;border-radius:10px;" data-action="edit-card">
            Editar configuração
          </button>
          <a href="https://github.com/soundflow-dev/soundflow-card" target="_blank" rel="noopener" style="text-decoration:none;display:flex;align-items:center;justify-content:center;padding:11px;font-size:12px;border-radius:10px;background:var(--sf-button-bg);border:1px solid var(--sf-border);color:var(--sf-text);font-weight:500;">
            GitHub ↗
          </a>
        </div>
      </div>
    `;
  }

  // ============================================================
  // RADIOS / FAVORITES / PLAYLISTS POPUPS
  // ============================================================

  async _loadRadios() {
    if (!this._maConfigEntryId) {
      this._popupData = { items: [], error: 'Config entry do MA não encontrado' };
      this._renderPopup();
      return;
    }
    this._popupData = { loading: true };
    this._renderPopup();
    try {
      const items = await maGetLibrary(this._hass, this._maConfigEntryId, 'radio', { favorite: true, limit: 100 });
      this._popupData = { items };
    } catch (e) {
      this._popupData = { items: [], error: 'Erro ao carregar rádios' };
    }
    this._renderPopup();
  }

  async _loadFavorites() {
    // Carrega contagens de favoritos por categoria (passo 1 — menu)
    if (!this._maConfigEntryId) {
      this._popupData = { error: 'Config entry do MA não encontrado' };
      this._renderPopup();
      return;
    }
    this._popupData = { loading: true };
    this._renderPopup();
    try {
      const types = ['playlist', 'album', 'artist', 'track'];
      const counts = {};
      // Faz pedidos em paralelo, com limit alto para conseguir contagem real
      const results = await Promise.all(
        types.map((t) =>
          maGetLibrary(this._hass, this._maConfigEntryId, t, { favorite: true, limit: 500 })
            .then((items) => [t, items.length])
            .catch(() => [t, 0])
        )
      );
      for (const [t, n] of results) counts[t] = n;
      this._popupData = { categoryCounts: counts };
    } catch (e) {
      this._popupData = { error: 'Erro ao carregar favoritos' };
    }
    this._renderPopup();
  }

  async _loadFavoritesCategory(mediaType) {
    if (!this._maConfigEntryId) {
      this._popupData = { items: [], error: 'Config entry do MA não encontrado' };
      this._renderPopup();
      return;
    }
    this._popupData = { loading: true };
    this._renderPopup();
    try {
      const items = await maGetLibrary(this._hass, this._maConfigEntryId, mediaType, { favorite: true, limit: 500 });
      items.forEach((i) => { i._media_type = mediaType; });
      this._popupData = { items, categoryType: mediaType };
    } catch (e) {
      this._popupData = { items: [], error: 'Erro ao carregar' };
    }
    this._renderPopup();
  }

  async _loadProviderPlaylists() {
    if (!this._maConfigEntryId) {
      this._popupData = { items: [], error: 'Config entry do MA não encontrado' };
      this._renderPopup();
      return;
    }
    this._popupData = { loading: true };
    this._renderPopup();
    try {
      const items = await maGetLibrary(this._hass, this._maConfigEntryId, 'playlist', { limit: 100 });
      const ctx = this._sourceDetailContext || {};
      const filtered = items.filter((it) => {
        if (!ctx.instance_id && !ctx.domain) return true;
        if (it.provider === ctx.instance_id) return true;
        if (Array.isArray(it.provider_mappings) && it.provider_mappings.some(
          (pm) => pm.provider_instance === ctx.instance_id || pm.provider_domain === ctx.domain
        )) return true;
        return false;
      });
      this._popupData = { items: filtered };
    } catch (e) {
      this._popupData = { items: [], error: 'Erro ao carregar playlists' };
    }
    this._renderPopup();
  }

  _renderListPopup(opts) {
    const { title, backAction, data, emptyMsg, renderIcon, iconBg, mediaType, mediaTypeFromItem } = opts;
    let body;
    if (data.loading) {
      body = '<div class="sf-loader">A carregar…</div>';
    } else if (data.error) {
      body = `<div class="sf-empty">${this._esc(data.error)}</div>`;
    } else if (!data.items || data.items.length === 0) {
      body = `<div class="sf-empty">${emptyMsg}</div>`;
    } else {
      body = `
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${data.items.map((item) => {
            const itemMediaType = mediaTypeFromItem ? (item._media_type || item.media_type) : mediaType;
            const subtitleParts = [];
            if (item.artists && item.artists.length > 0) subtitleParts.push(item.artists[0].name);
            if (itemMediaType === 'playlist' && item.owner) subtitleParts.push(`por ${item.owner}`);
            if (mediaTypeFromItem) {
              const labelMap = { track: 'Música', album: 'Álbum', playlist: 'Playlist', artist: 'Artista' };
              subtitleParts.unshift(labelMap[itemMediaType] || itemMediaType);
            }
            const subtitle = subtitleParts.join(' · ');
            return `
              <div class="sf-list-item" data-action="play-item" data-uri="${this._esc(item.uri)}" data-media-type="${this._esc(itemMediaType)}" data-name="${this._esc(item.name || '')}">
                <div class="sf-list-item-icon" style="background:${iconBg};">${renderIcon(item)}</div>
                <div class="sf-list-item-content">
                  <div class="sf-list-item-title">${this._esc(item.name || 'Sem nome')}</div>
                  ${subtitle ? `<div class="sf-list-item-subtitle">${this._esc(subtitle)}</div>` : ''}
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--sf-pink)" style="flex-shrink:0;">${ICONS.shuffle_play}</svg>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
    return `
      <div class="sf-popup-header">
        <div style="display:flex;align-items:center;gap:12px;">
          <button class="sf-icon-btn sf-circle" style="width:36px;height:36px;" data-action="${backAction}">
            <svg width="20" height="20" viewBox="0 0 24 24">${ICONS.back}</svg>
          </button>
          <span class="sf-popup-title">${this._esc(title)}</span>
        </div>
        <button class="sf-icon-btn sf-circle" style="width:36px;height:36px;" data-action="close-popup">
          <svg width="20" height="20" viewBox="0 0 24 24">${ICONS.close}</svg>
        </button>
      </div>
      ${body}
    `;
  }

  _renderSourceRadiosPopup() {
    return this._renderListPopup({
      title: 'Rádios favoritas',
      backAction: 'open-source',
      data: this._popupData || {},
      emptyMsg: 'Não há rádios favoritas no Music Assistant.',
      renderIcon: (item) => {
        if (item.image && item.image.path) {
          return `<img src="${this._esc(item.image.path)}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" onerror="this.style.display='none'">`;
        }
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${PROVIDER_SVGS.radio}</svg>`;
      },
      iconBg: 'linear-gradient(135deg, #FFB800 0%, #FF8800 100%)',
      mediaType: 'radio',
    });
  }

  _renderSourceFavoritesPopup() {
    // Menu de categorias
    const data = this._popupData || {};
    const counts = data.categoryCounts || {};

    let body;
    if (data.loading) {
      body = '<div class="sf-loader">A carregar…</div>';
    } else if (data.error) {
      body = `<div class="sf-empty">${this._esc(data.error)}</div>`;
    } else {
      const categories = [
        { key: 'playlist', label: 'Playlists', icon: PROVIDER_SVGS.music, gradient: 'linear-gradient(135deg, #EA3572 0%, #C729C7 100%)' },
        { key: 'album',    label: 'Álbuns',    icon: PROVIDER_SVGS.music, gradient: 'linear-gradient(135deg, #C729C7 0%, #7B3FE4 100%)' },
        { key: 'artist',   label: 'Artistas',  icon: PROVIDER_SVGS.music, gradient: 'linear-gradient(135deg, #7B3FE4 0%, #5B6BFF 100%)' },
        { key: 'track',    label: 'Músicas',   icon: PROVIDER_SVGS.music, gradient: 'linear-gradient(135deg, #FF8800 0%, #EA3572 100%)' },
      ];
      const total = (counts.playlist || 0) + (counts.album || 0) + (counts.artist || 0) + (counts.track || 0);
      if (total === 0) {
        body = '<div class="sf-empty">Sem favoritos no Music Assistant.</div>';
      } else {
        body = `
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${categories.map((c) => {
              const n = counts[c.key] || 0;
              const disabled = n === 0;
              return `
                <div class="sf-list-item ${disabled ? 'sf-disabled' : ''}" ${disabled ? '' : `data-action="open-favorites-category" data-category="${c.key}"`}>
                  <div class="sf-list-item-icon" style="background:${c.gradient};">
                    ${this._renderSfWave(16, 'white')}
                  </div>
                  <div class="sf-list-item-content">
                    <div class="sf-list-item-title">${c.label}</div>
                    <div class="sf-list-item-subtitle">${n === 0 ? 'Sem favoritos' : (n === 1 ? '1 item' : `${n} items`)}</div>
                  </div>
                  ${disabled ? '' : `<svg width="20" height="20" viewBox="0 0 24 24" fill="var(--sf-text-3)" style="flex-shrink:0;">${ICONS.chevron_right}</svg>`}
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    }

    return `
      <div class="sf-popup-header">
        <div style="display:flex;align-items:center;gap:12px;">
          <button class="sf-icon-btn sf-circle" style="width:36px;height:36px;" data-action="open-source">
            <svg width="20" height="20" viewBox="0 0 24 24">${ICONS.back}</svg>
          </button>
          <span class="sf-popup-title">Favoritos do Music Assistant</span>
        </div>
        <button class="sf-icon-btn sf-circle" style="width:36px;height:36px;" data-action="close-popup">
          <svg width="20" height="20" viewBox="0 0 24 24">${ICONS.close}</svg>
        </button>
      </div>
      ${body}
    `;
  }

  _renderSourceFavoritesCategoryPopup() {
    const data = this._popupData || {};
    const cat = data.categoryType || 'track';
    const titleMap = { playlist: 'Playlists favoritas', album: 'Álbuns favoritos', artist: 'Artistas favoritos', track: 'Músicas favoritas' };
    return this._renderListPopup({
      title: titleMap[cat] || 'Favoritos',
      backAction: 'select-source-favorites',
      data,
      emptyMsg: 'Sem favoritos nesta categoria.',
      renderIcon: (item) => {
        if (item.image && item.image.path) {
          return `<img src="${this._esc(item.image.path)}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" onerror="this.style.display='none'">`;
        }
        return this._renderSfWave(16, 'white');
      },
      iconBg: 'var(--sf-grad)',
      mediaType: cat,
    });
  }

  _renderSourcePlaylistsPopup() {
    return this._renderListPopup({
      title: 'Playlists',
      backAction: 'select-source-provider',
      data: this._popupData || {},
      emptyMsg: 'Sem playlists nesta conta.',
      renderIcon: (item) => {
        if (item.image && item.image.path) {
          return `<img src="${this._esc(item.image.path)}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" onerror="this.style.display='none'">`;
        }
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="white">${PROVIDER_SVGS.music}</svg>`;
      },
      iconBg: 'rgba(123,63,228,0.5)',
      mediaType: 'playlist',
    });
  }

  // ============================================================
  // PLAY ACTIONS
  // ============================================================

  async _playProviderTracks(ctx) {
    const player = this._activePlayer;
    if (!player) return;

    try {
      await this._hass.callService('media_player', 'shuffle_set', { shuffle: true }, { entity_id: player.entity_id });
    } catch (e) { /* ignore */ }

    try {
      const tracks = await maGetLibrary(this._hass, this._maConfigEntryId, 'track', { limit: 500 });
      const filtered = tracks.filter((t) => {
        if (Array.isArray(t.provider_mappings) && t.provider_mappings.some(
          (pm) => pm.provider_instance === ctx.instance_id || pm.provider_domain === ctx.domain
        )) return true;
        if (t.provider === ctx.instance_id) return true;
        return false;
      });
      if (filtered.length === 0) return;

      const shuffled = filtered.slice().sort(() => Math.random() - 0.5);
      const uris = shuffled.map((t) => t.uri).filter(Boolean);
      if (uris.length > 0) {
        await this._hass.callService('music_assistant', 'play_media', {
          media_id: uris,
          media_type: 'track',
        }, { entity_id: player.entity_id });
      }
    } catch (e) {
      console.warn('[SoundFlow] Play provider tracks failed:', e);
    }

    await this._maybeGroupSpeakers();
  }

  async _playSelectedItem(uri, mediaType, name) {
    const player = this._activePlayer;
    if (!player) return;

    this._selectedSource = {
      kind: mediaType === 'radio' ? 'radio-station' : 'item',
      uri,
      mediaType,
      label: name,
    };

    try {
      await this._hass.callService('music_assistant', 'play_media', {
        media_id: uri,
        media_type: mediaType,
      }, { entity_id: player.entity_id });
    } catch (e) {
      console.warn('[SoundFlow] Play item failed:', e);
    }

    await this._maybeGroupSpeakers();
  }

  async _maybeGroupSpeakers() {
    const ids = this._selectedSpeakers;
    if (ids.length < 2) return;
    const leader = this._activePlayer ? this._activePlayer.entity_id : ids[0];
    if (!ids.includes(leader)) return;
    try {
      await groupPlayers(this._hass, leader, ids);
    } catch (e) {
      console.warn('[SoundFlow] Group speakers failed:', e);
    }
  }

  // ============================================================
  // SEARCH
  // ============================================================

  _scheduleSearch() {
    if (this._searchDebounce) clearTimeout(this._searchDebounce);
    this._searchDebounce = setTimeout(() => this._performSearch(), 600);
  }

  async _performSearch() {
    if (!this._searchQuery || this._searchQuery.length < 3) {
      this._searchResults = null;
      if (this._popup === 'search-results') {
        this._popup = null;
        this._renderPopup();
      }
      return;
    }
    if (!this._maConfigEntryId) return;

    this._searchInProgress = true;
    if (this._popup !== 'search-results') {
      this._popup = 'search-results';
    }
    this._renderPopup();

    try {
      let results = null;
      if (this._selectedSource && this._selectedSource.kind === 'provider-tracks') {
        results = await maSearch(this._hass, this._maConfigEntryId, this._searchQuery, ['track', 'album', 'artist'], true);
        const empty = !results ||
          ((!results.tracks || results.tracks.length === 0) &&
           (!results.albums || results.albums.length === 0) &&
           (!results.artists || results.artists.length === 0));
        if (empty) {
          results = await maSearch(this._hass, this._maConfigEntryId, this._searchQuery, ['track', 'album', 'artist'], false);
        }
      } else {
        results = await maSearch(this._hass, this._maConfigEntryId, this._searchQuery, ['track', 'album', 'artist'], false);
      }
      this._searchResults = results;
    } catch (e) {
      this._searchResults = null;
    }
    this._searchInProgress = false;
    this._renderPopup();
  }

  _renderSearchResultsPopup() {
    const r = this._searchResults || {};
    const tracks = (r.tracks || []).slice(0, 20);
    const albums = (r.albums || []).slice(0, 10);
    const artists = (r.artists || []).slice(0, 10);

    let body;
    if (this._searchInProgress) {
      body = '<div class="sf-loader">A pesquisar…</div>';
    } else if (!this._searchResults || (tracks.length === 0 && albums.length === 0 && artists.length === 0)) {
      body = `<div class="sf-empty">Sem resultados para "${this._esc(this._searchQuery)}"</div>`;
    } else {
      const sections = [];
      if (tracks.length > 0) {
        sections.push(`
          <div style="font-size:11px;color:var(--sf-text-3);text-transform:uppercase;letter-spacing:0.05em;margin:4px 0 6px;">Músicas</div>
          ${tracks.map((t) => this._renderSearchItem(t, 'track')).join('')}
        `);
      }
      if (albums.length > 0) {
        sections.push(`
          <div style="font-size:11px;color:var(--sf-text-3);text-transform:uppercase;letter-spacing:0.05em;margin:14px 0 6px;">Álbuns</div>
          ${albums.map((a) => this._renderSearchItem(a, 'album')).join('')}
        `);
      }
      if (artists.length > 0) {
        sections.push(`
          <div style="font-size:11px;color:var(--sf-text-3);text-transform:uppercase;letter-spacing:0.05em;margin:14px 0 6px;">Artistas</div>
          ${artists.map((a) => this._renderSearchItem(a, 'artist')).join('')}
        `);
      }
      body = sections.join('');
    }

    return `
      <div class="sf-popup-header">
        <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
          <button class="sf-icon-btn sf-circle" style="width:36px;height:36px;" data-action="close-popup">
            <svg width="20" height="20" viewBox="0 0 24 24">${ICONS.close}</svg>
          </button>
          <span class="sf-popup-title" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">"${this._esc(this._searchQuery)}"</span>
        </div>
      </div>
      ${body}
    `;
  }

  _renderSearchItem(item, mediaType) {
    const subtitleParts = [];
    if (item.artists && item.artists.length > 0) subtitleParts.push(item.artists[0].name);
    if (mediaType === 'album' && item.year) subtitleParts.push(item.year);
    const subtitle = subtitleParts.join(' · ');
    const imgHtml = item.image && item.image.path
      ? `<img src="${this._esc(item.image.path)}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="white">${PROVIDER_SVGS.music}</svg>`;
    return `
      <div class="sf-list-item" data-action="play-item" data-uri="${this._esc(item.uri)}" data-media-type="${this._esc(mediaType)}" data-name="${this._esc(item.name || '')}" style="margin-bottom:6px;">
        <div class="sf-list-item-icon" style="background:var(--sf-grad);">${imgHtml}</div>
        <div class="sf-list-item-content">
          <div class="sf-list-item-title">${this._esc(item.name || 'Sem nome')}</div>
          ${subtitle ? `<div class="sf-list-item-subtitle">${this._esc(subtitle)}</div>` : ''}
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--sf-pink)">${ICONS.shuffle_play}</svg>
      </div>
    `;
  }
}

customElements.define('soundflow-card', SoundFlowCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'soundflow-card',
  name: 'SoundFlow Card',
  preview: false,
  description: 'Card elegante para controlar o Music Assistant a partir do dashboard',
  documentationURL: 'https://github.com/soundflow-dev/soundflow-card',
});
