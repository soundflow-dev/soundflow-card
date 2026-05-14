import { CSS } from './styles.js';
import { svgIcon } from './icons.js';
import { t, plural } from './i18n.js';
import { applyTheme } from './theme.js';
import { providerSvg, providerInfo } from './providers.js';
import * as MA from './api/ma.js';
import * as ST from './api/state.js';
import { renderSpeakersPopup } from './ui/popup-speakers.js';
import { renderSourcePopup } from './ui/popup-source.js';
import { renderSearchResults } from './ui/popup-search.js';

export class SoundFlowCard extends HTMLElement {
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
    this._popupOpen = null; // 'source' | 'speakers' | 'search' | null
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
    return MA.listMassPlayers(this._hass);
  }
  _visiblePlayers() {
    const all = this._allMassPlayers();
    const allow = this._config?.players;
    if (!allow || !Array.isArray(allow) || allow.length === 0) return all;
    const set = new Set(allow);
    return all.filter(p => set.has(p.entity_id));
  }
  _activeGroup() {
    return ST.getActiveGroup(this._hass, this._allMassPlayers());
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
    return ST.lastPlayedPlayer(this._hass, this._visiblePlayers());
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
    const leader = ST.pickRandomLeader(sel);
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
    const info = ST.getMediaInfo(s);
    const playing = ST.isPlaying(s);
    const titleCfg = this._config.title;

    if (!s) {
      this._root.innerHTML = `<div class="sf-mini" data-empty="1"><div class="sf-mini-info"><div class="sf-mini-title">${t(this._hass, 'card_name')}</div><div class="sf-mini-subtitle">${t(this._hass, 'error_no_players')}</div></div></div>`;
      return;
    }

    const title = info.title || titleCfg || t(this._hass, 'nothing_playing');
    const subtitle = (info.artist || '') + (info.artist && s.attributes.friendly_name ? ' · ' : '') + (s.attributes.friendly_name || '');
    const cover = info.image ? this._absUrl(info.image) : '';

    const progress = info.duration ? Math.min(100, (ST.livePosition(info, s) / info.duration) * 100) : 0;

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
    mini.querySelector('[data-act="prev"]').addEventListener('click', (e) => { e.stopPropagation(); MA.prev(this._hass, dp); });
    mini.querySelector('[data-act="next"]').addEventListener('click', (e) => { e.stopPropagation(); MA.next(this._hass, dp); });
    mini.querySelector('[data-act="playpause"]').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (this._pendingMedia) { await this._executePending(); return; }
      if (playing) MA.pause(this._hass, dp);
      else MA.play(this._hass, dp);
    });
    this._scheduleTick();
  }

  _updateMiniProgress() {
    const bar = this._root?.querySelector('.sf-mini .sf-progress > span');
    if (!bar) return;
    const dp = this._displayPlayer();
    const s = this._hass.states[dp];
    const info = ST.getMediaInfo(s);
    const pct = info.duration ? Math.min(100, (ST.livePosition(info, s) / info.duration) * 100) : 0;
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
    if (this._popupOpen) { this._popupOpen = null; this._sourceView = null; this._renderModal(); }
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
    const info = ST.getMediaInfo(s);
    const playing = ST.isPlaying(s);
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
    const pos = ST.livePosition(info, s);
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
        <span>${ST.formatTime(pos)}</span>
        <div class="sf-seek-track" id="sf-seek"><span style="width:${pct}%"></span></div>
        <span>${ST.formatTime(dur)}</span>
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
    const info = ST.getMediaInfo(s);
    const dur = info.duration || 0;
    const pos = ST.livePosition(info, s);
    const pct = dur ? Math.min(100, (pos / dur) * 100) : 0;
    const bar = host.querySelector('#sf-seek > span');
    if (bar) bar.style.width = pct + '%';
    const seek = host.querySelector('.sf-seek');
    if (seek) {
      seek.firstElementChild.textContent = ST.formatTime(pos);
      seek.lastElementChild.textContent = ST.formatTime(dur);
    }
  }

  _wireModalEvents(host, dp) {
    const sel = this._activeSelection();
    const targets = sel.length ? sel : [dp];

    host.querySelector('[data-act="close"]').addEventListener('click', () => this._closeModal());
    host.querySelector('[data-act="prev"]').addEventListener('click', () => MA.prev(this._hass, dp));
    host.querySelector('[data-act="next"]').addEventListener('click', () => MA.next(this._hass, dp));
    host.querySelector('[data-act="playpause"]').addEventListener('click', async () => {
      if (this._pendingMedia) { await this._executePending(); return; }
      const isP = ST.isPlaying(this._hass.states[dp]);
      isP ? MA.pause(this._hass, dp) : MA.play(this._hass, dp);
    });
    host.querySelector('[data-act="shuffle"]').addEventListener('click', () => {
      const cur = !!this._hass.states[dp]?.attributes?.shuffle;
      MA.setShuffle(this._hass, dp, !cur);
    });
    host.querySelector('[data-act="repeat"]').addEventListener('click', () => {
      const cur = this._hass.states[dp]?.attributes?.repeat || 'off';
      const nx = cur === 'off' ? 'all' : cur === 'all' ? 'one' : 'off';
      MA.setRepeat(this._hass, dp, nx);
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
      targets.forEach(id => MA.setMute(this._hass, id, !muted));
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
            try { await MA.unjoin(this._hass, p.entity_id); } catch (e) {}
          }
        }
      } else if (desired.size === 1) {
        // Só uma coluna: separar os outros membros do grupo (deixar a coluna sozinha)
        const only = [...desired][0];
        const others = [...currentAll].filter(x => x !== only);
        for (const m of others) {
          try { await MA.unjoin(this._hass, m); } catch (e) {}
        }
      } else {
        // 2+ colunas: formar grupo coerente com 1 join (batch).
        const arr = [...desired];
        // Manter líder actual se estiver na selecção, senão eleger novo
        const leader = currentLeader && desired.has(currentLeader) ? currentLeader : ST.pickRandomLeader(arr);
        const wantedMembers = new Set(arr.filter(x => x !== leader));
        const currentMembers = new Set([...currentAll].filter(x => x !== leader));
        const leaderChanged = currentLeader && currentLeader !== leader && currentAll.has(currentLeader);
        const oldLeaderHadMedia = leaderChanged && this._playerHasMedia(currentLeader);

        // 1) Tirar membros que já não queremos
        const toRemove = [...currentMembers].filter(x => !wantedMembers.has(x));
        for (const m of toRemove) {
          try { await MA.unjoin(this._hass, m); } catch (e) {}
        }
        // 2) Se mudámos de líder, ungroup do líder antigo para libertar o seu groupId
        if (leaderChanged) {
          try { await MA.unjoin(this._hass, currentLeader); } catch (e) {}
        }
        // 3) Pequena pausa antes do join — dá tempo ao MA/Sonos para estabilizar
        //    o estado dos ungroups antes de pedir um novo group_many.
        const toAdd = [...wantedMembers].filter(x => x !== leader);
        if (toAdd.length) {
          if (toRemove.length || leaderChanged) await sleep(300);
          await MA.joinPlayers(this._hass, leader, toAdd);
        }
        // 4) Se a liderança mudou e o antigo líder estava a tocar, transferir
        //    a queue MA para o novo líder. Sem isto, a música simplesmente pára
        //    quando o user desselecciona/troca o líder — testado e funciona limpo.
        if (oldLeaderHadMedia) {
          await sleep(300);
          try { await MA.transferQueue(this._hass, currentLeader, leader, true); }
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
      for (const p of visible) { try { await MA.unjoin(this._hass, p.entity_id); } catch (e) {} }
    } else {
      const ids = visible.map(p => p.entity_id);
      this._selectedSpeakers = ids;
      this._lastUserActionTs = Date.now();
      this._renderPopup();
      // Se já há um líder a tocar, juntar os restantes a ele (sem cortar)
      const leader = grp?.leader && ids.includes(grp.leader) ? grp.leader : ST.pickRandomLeader(ids);
      const members = ids.filter(x => x !== leader);
      if (members.length) await MA.joinPlayers(this._hass, leader, members);
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
    return MA.setVolume(this._hass, id, Math.max(0, Math.min(1, cur + delta)));
  }
  async _setVolume(id, pct) {
    return MA.setVolume(this._hass, id, Math.max(0, Math.min(1, pct)));
  }
  async _equalizeVolume() {
    const pct = (this._config.equalize_volume ?? 2) / 100;
    const targets = this._activeSelection();
    const ids = targets.length ? targets : this._visiblePlayers().map(p => p.entity_id);
    for (const id of ids) await MA.setVolume(this._hass, id, pct);
    this._toast(t(this._hass, 'volume_equalized', { n: this._config.equalize_volume ?? 2 }));
  }

  // ============ DATA HELPERS ============

  async _getProviders() {
    if (this._cachedProviders) return this._cachedProviders;
    const list = await MA.getProviders(this._hass);
    this._cachedProviders = list;
    return list;
  }
  async _getLibrary(kind, opts = {}) {
    const key = JSON.stringify({ kind, ...opts });
    const cached = this._libCache.get(key);
    if (cached && (Date.now() - cached.ts < 60_000)) return cached.data;
    const data = await MA.getLibrary(this._hass, null, kind, opts);
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
    const items = await MA.getLibraryTracksByProvider(this._hass, providerInstanceId, {
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
      try { await MA.joinPlayers(this._hass, target.leader, others); } catch (e) {}
      await sleep(200);
    }
    const { mediaId, mediaType, shuffle, radioMode } = this._pendingMedia;
    await MA.playMedia(this._hass, target.leader, mediaId, {
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
    let r = await MA.search(this._hass, null, query, { libraryOnly: true, providerInstanceId: provider });
    const isEmpty = !r || (!r.tracks?.length && !r.albums?.length && !r.artists?.length && !r.playlists?.length && !r.radios?.length);
    if (isEmpty) {
      r = await MA.search(this._hass, null, query, { libraryOnly: false, providerInstanceId: provider });
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
