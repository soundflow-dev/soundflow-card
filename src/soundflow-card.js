// soundflow-card.js - Card SoundFlow consolidado
// Versão: 0.3.1 | Licença: MIT

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

const CARD_VERSION = "0.3.1";

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

  /**
   * Devolve os entity_ids dos players que estão atualmente a tocar ou em pausa.
   * Esta é a "verdade" — vem direto do HA e sincroniza entre dispositivos.
   */
  _getPlayingPlayers() {
    if (!this._hass) return [];
    return this._players
      .filter((p) => p.state === 'playing' || p.state === 'paused')
      .map((p) => p.entity_id);
  }

  /**
   * O que aparece "selecionado" no popup de colunas:
   * - Se há colunas a tocar: essas são as selecionadas (override do HA, sincroniza)
   * - Se nada está a tocar: usa a seleção temporária `_selectedSpeakers` (memória local)
   */
  _getActiveSelection() {
    const playing = this._getPlayingPlayers();
    if (playing.length > 0) return playing;
    return this._selectedSpeakers;
  }

  _getEffectiveSpeakers() {
    // Para volume/mute/play: prioriza o que está a tocar; senão seleção; senão active player
    const playing = this._getPlayingPlayers();
    if (playing.length > 0) return playing;
    if (this._selectedSpeakers.length > 0) return this._selectedSpeakers;
    if (this._activePlayer) return [this._activePlayer.entity_id];
    return [];
  }

  _getSpeakerLabel() {
    const ids = this._getActiveSelection();
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

  /**
   * Toggle de uma coluna. Comportamento depende do estado atual:
   *   A) Se há algo a tocar:
   *      - Coluna está no grupo de play → unjoin (pára nessa coluna)
   *      - Coluna não está → join ao grupo atual (adiciona)
   *   B) Se nada está a tocar:
   *      - Apenas atualiza a seleção temporária (memória local)
   */
  async _toggleSpeaker(entityId) {
    const playing = this._getPlayingPlayers();

    if (playing.length === 0) {
      // CASE B: ninguém toca → memória local
      if (this._selectedSpeakers.includes(entityId)) {
        this._selectedSpeakers = this._selectedSpeakers.filter((id) => id !== entityId);
      } else {
        this._selectedSpeakers = [...this._selectedSpeakers, entityId];
      }
      if (this._selectedSpeakers.length > 0) {
        const first = this._players.find((p) => p.entity_id === this._selectedSpeakers[0]);
        if (first) this._activePlayer = first;
      }
      return;
    }

    // CASE A: algo está a tocar
    if (playing.includes(entityId)) {
      // Removendo uma coluna do grupo
      const remaining = playing.filter((id) => id !== entityId);
      const currentLeader = this._findCurrentLeader(playing);

      if (remaining.length === 0) {
        // Era a única → simplesmente unjoin
        try {
          await unjoinPlayer(this._hass, entityId);
        } catch (e) { console.warn('[SoundFlow] unjoin failed:', e); }
        return;
      }

      if (entityId === currentLeader) {
        // CASO CRÍTICO: estamos a desselecionar o LEADER.
        // Fazer unjoin no leader normalmente pára tudo. Em vez disso,
        // promovemos outro player a leader: chamar join(novo_leader, restantes).
        // O MA transfere o stream para o novo leader e o antigo sai do grupo.
        const newLeader = remaining[0];
        try {
          await groupPlayers(this._hass, newLeader, remaining);
          // Atualizar activePlayer para o novo leader (importante para play/pause/next)
          const leaderObj = this._players.find((p) => p.entity_id === newLeader);
          if (leaderObj) this._activePlayer = leaderObj;
        } catch (e) {
          console.warn('[SoundFlow] Leader transfer failed, falling back to unjoin:', e);
          // Fallback: tentar unjoin direto (pode parar tudo, mas é melhor que ficar inconsistente)
          try { await unjoinPlayer(this._hass, entityId); } catch (e2) { /* ignore */ }
        }
      } else {
        // Não é o leader → unjoin normal (o resto continua a tocar)
        try {
          await unjoinPlayer(this._hass, entityId);
        } catch (e) { console.warn('[SoundFlow] unjoin failed:', e); }
      }
    } else {
      // Adicionar ao grupo: usar o leader atual como base
      const leader = this._findCurrentLeader(playing);
      if (!leader) return;
      const newMembers = [...playing, entityId];
      try {
        await groupPlayers(this._hass, leader, newMembers);
      } catch (e) { console.warn('[SoundFlow] join failed:', e); }
    }
  }

  /**
   * Encontra o leader atual de um conjunto de players a tocar.
   * Leader é o player que tem outros como group_members.
   */
  _findCurrentLeader(playingIds) {
    if (!this._hass || playingIds.length === 0) return null;
    if (playingIds.length === 1) return playingIds[0];
    // Procurar o player com group_members.length > 1
    for (const id of playingIds) {
      const s = this._hass.states[id];
      const members = s && s.attributes.group_members;
      if (Array.isArray(members) && members.length > 1) return id;
    }
    return playingIds[0];
  }

  async _selectAllSpeakers() {
    const playing = this._getPlayingPlayers();
    const allIds = this._players.map((p) => p.entity_id);

    if (playing.length === 0) {
      // CASE B: memória local — toggle entre todas/nenhuma
      if (this._selectedSpeakers.length === this._players.length) {
        this._selectedSpeakers = [];
      } else {
        this._selectedSpeakers = allIds;
        if (allIds.length > 0) {
          const first = this._players.find((p) => p.entity_id === allIds[0]);
          if (first) this._activePlayer = first;
        }
      }
      return;
    }

    // CASE A: algo toca
    const allPlaying = playing.length === this._players.length;
    if (allPlaying) {
      // Toda a casa toca → desagrupar tudo
      const tasks = [];
      for (const id of playing) {
        const s = this._hass.states[id];
        const members = s && s.attributes.group_members;
        if (Array.isArray(members) && members.length > 1) {
          tasks.push(unjoinPlayer(this._hass, id).catch(() => {}));
        }
      }
      if (tasks.length > 0) await Promise.all(tasks);
    } else {
      // Adicionar todos ao grupo do leader atual
      const leader = this._findCurrentLeader(playing);
      if (!leader) return;
      try {
        await groupPlayers(this._hass, leader, allIds);
      } catch (e) { console.warn('[SoundFlow] group all failed:', e); }
    }
  }

  /**
   * Calcula dinamicamente qual o leader implícito da seleção atual.
   * Heurística previsível:
   *   1. Se algum dos selecionados está a tocar, esse é o leader
   *   2. Senão, se o _activePlayer está nos selecionados, é ele
   *   3. Fallback: o primeiro da seleção
   */
  _getImplicitLeader() {
    const ids = this._selectedSpeakers.length > 0
      ? this._selectedSpeakers
      : (this._activePlayer ? [this._activePlayer.entity_id] : []);
    if (ids.length === 0) return null;
    if (ids.length === 1) return ids[0];

    // 1. A tocar?
    for (const id of ids) {
      const s = this._hass.states[id];
      if (s && s.state === 'playing') return id;
    }
    // 2. _activePlayer presente na seleção?
    if (this._activePlayer && ids.includes(this._activePlayer.entity_id)) {
      return this._activePlayer.entity_id;
    }
    // 3. Primeiro
    return ids[0];
  }

  /**
   * Reconcilia o grouping real do HA com `_selectedSpeakers`.
   * - Se 0 ou 1 selecionados: desagrupa o que estiver agrupado dos selecionados/leader anterior
   * - Se 2+ selecionados: junta-os todos com o leader implícito
   * Idempotente: se já está sincronizado, não faz nada.
   */
  async _syncGrouping() {
    if (!this._hass) return;
    const selected = this._selectedSpeakers.slice();
    const leader = this._getImplicitLeader();

    // CASE A: 0 ou 1 selecionados → garantir que ninguém está agrupado dos players visíveis
    if (selected.length <= 1) {
      const tasks = [];
      for (const p of this._players) {
        const s = this._hass.states[p.entity_id];
        const members = s && s.attributes.group_members;
        if (Array.isArray(members) && members.length > 1) {
          tasks.push(unjoinPlayer(this._hass, p.entity_id).catch(() => {}));
        }
      }
      if (tasks.length > 0) await Promise.all(tasks);
      return;
    }

    // CASE B: 2+ selecionados — verificar se já estão sincronizados como pretendido
    const leaderState = this._hass.states[leader];
    const currentMembers = leaderState && Array.isArray(leaderState.attributes.group_members)
      ? leaderState.attributes.group_members.slice().sort()
      : [];
    const desired = selected.slice().sort();
    const sameSet = currentMembers.length === desired.length
      && currentMembers.every((m, i) => m === desired[i]);

    if (sameSet) return; // já está como queremos

    // Antes de juntar com o novo grupo, desagrupar quaisquer outros grupos órfãos
    const orphanTasks = [];
    for (const p of this._players) {
      if (selected.includes(p.entity_id)) continue;
      const s = this._hass.states[p.entity_id];
      const members = s && s.attributes.group_members;
      if (Array.isArray(members) && members.length > 1) {
        orphanTasks.push(unjoinPlayer(this._hass, p.entity_id).catch(() => {}));
      }
    }
    if (orphanTasks.length > 0) await Promise.all(orphanTasks);

    // Aplicar novo grouping
    try {
      await groupPlayers(this._hass, leader, selected);
      // Atualizar activePlayer para o leader implícito (mas sem mexer em tudo)
      const leaderObj = this._players.find((p) => p.entity_id === leader);
      if (leaderObj) this._activePlayer = leaderObj;
    } catch (e) {
      console.warn('[SoundFlow] Auto-sync grouping failed:', e);
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
    // Volume médio dos efetivos
    const eff = this._getEffectiveSpeakers();
    const effVols = eff.map((id) => {
      const s = this._hass.states[id];
      return s ? `${Math.round((s.attributes.volume_level || 0) * 100)}:${s.attributes.is_volume_muted ? 1 : 0}` : '';
    }).join(';');
    return [
      p.entity_id, p.state,
      a.media_title || '', a.media_artist || '', a.media_album_name || '',
      a.entity_picture_local || a.entity_picture || '',
      a.shuffle, a.repeat,
      effVols,
      this._selectedSource ? this._selectedSource.label : '',
      this._selectedSpeakers.join(','),
      this._searchQuery,
      this._searchInProgress ? 1 : 0,
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

    // Auto-refresh do popup se estiver aberto (volume changes, etc.)
    if (this._popup) {
      this._renderPopup();
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

    if (existing) {
      // Soft refresh: substituir só o conteúdo interno
      const inner = existing.querySelector('#sf-modal-content');
      if (inner) {
        // Preservar foco do input de pesquisa se existir
        const focusedSearch = inner.querySelector('[data-action="search-input"]:focus');
        const cursorPos = focusedSearch ? focusedSearch.selectionStart : null;

        inner.innerHTML = this._renderModalBody();
        this._attachModalListeners(existing);

        if (focusedSearch !== null && cursorPos !== null) {
          const newSearch = inner.querySelector('[data-action="search-input"]');
          if (newSearch) {
            newSearch.focus();
            try { newSearch.setSelectionRange(cursorPos, cursorPos); } catch (e) { /* ignore */ }
          }
        }

        if (this._popup) this._renderPopup();
        return;
      }
    }

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
      <div style="display:flex;align-items:center;gap:8px;padding:8px 8px 8px 14px;background:var(--sf-button-bg);border:1px solid var(--sf-border);border-radius:14px;margin-bottom:14px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sf-text-3)" stroke-width="2" style="flex-shrink:0;">${ICONS.search}</svg>
        <input
          type="text"
          placeholder="Pesquisar música, artista, álbum…"
          value="${this._esc(this._searchQuery || '')}"
          style="flex:1;background:transparent;border:none;color:var(--sf-text);font-size:13px;outline:none;font-family:inherit;min-width:0;"
          data-action="search-input">
        ${this._searchQuery ? `
          <button class="sf-icon-btn sf-circle" style="width:32px;height:32px;flex-shrink:0;" data-action="search-clear" title="Limpar">
            <svg width="16" height="16" viewBox="0 0 24 24">${ICONS.close}</svg>
          </button>
        ` : ''}
        <button class="sf-icon-btn sf-grad" style="width:36px;height:36px;border-radius:50%;flex-shrink:0;" data-action="search-submit" title="Pesquisar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">${ICONS.search}</svg>
        </button>
      </div>
    `;

    const muteIcon = allMuted ? ICONS.mute : ICONS.volume;
    const muteTitle = allMuted ? 'Desmutar' : 'Silenciar';

    return `
      <div style="display:flex;justify-content:flex-end;align-items:center;margin-bottom:18px;">
        <button class="sf-icon-btn sf-circle" style="width:48px;height:48px;" data-action="close-modal" title="Fechar">
          <svg width="24" height="24" viewBox="0 0 24 24">${ICONS.close}</svg>
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
        <span style="font-size:13px;font-weight:500;min-width:42px;text-align:right;color:var(--sf-text-2);flex-shrink:0;">${volPct}%</span>
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
        // Apenas atualizar o estado interno; não pesquisa automaticamente.
        // Atualizar sem re-render para preservar foco.
        this._searchQuery = e.target.value;
      });
      searchInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          this._performSearch();
        } else if (e.key === 'Escape') {
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
      case 'mute': {
        // Mute global: aplica a todas as colunas selecionadas; se nenhuma estiver
        // selecionada, aplica a todas as colunas visíveis (para corresponder à
        // expectativa de um botão "silenciar tudo" no card principal).
        const targets = this._selectedSpeakers.length > 0
          ? this._selectedSpeakers
          : this._players.map((p) => p.entity_id);
        await toggleMute(this._hass, targets);
        break;
      }
      case 'equalize':
        equalizeVolumes(this._hass, this._getEffectiveSpeakers(), this._equalizeLevel); break;
      case 'open-source':
        this._popup = 'source'; this._renderPopup(); break;
      case 'open-speakers':
        this._popup = 'speakers'; this._renderPopup(); break;
      case 'select-player':
        // Popup unificado Player + Colunas (mantido por defesa, embora sem botão)
        this._popup = 'speakers'; this._renderPopup(); break;

      case 'search-submit':
        // Disparar pesquisa imediata (usa o valor já guardado em _searchQuery)
        this._performSearch();
        break;

      case 'search-clear':
        this._searchQuery = '';
        this._searchResults = null;
        if (this._popup === 'search-results') {
          this._popup = null;
          this._renderPopup();
        }
        this._renderModal();
        break;

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

    // Sem popup pedido → fechar
    if (!this._popup) {
      if (existing) existing.remove();
      this._popupHash = null;
      return;
    }

    // Calcular hash para detetar mudanças reais (evita re-render se nada muda)
    const newHash = this._computePopupHash();

    // Se já existe um overlay e o conteúdo é o mesmo, não tocar nada
    if (existing && this._popupHash === newHash) return;

    // Se já existe um overlay, fazer soft refresh — substituir só o conteúdo interno
    if (existing) {
      const inner = existing.querySelector('.sf-popup');
      if (inner) {
        inner.innerHTML = this._renderPopupBody();
        this._popupHash = newHash;
        this._attachPopupListeners(existing);
        return;
      }
    }

    // Caso contrário, criar overlay novo
    const popup = document.createElement('div');
    popup.className = 'sf-modal-overlay sf-popup-overlay';
    popup.style.zIndex = '10000';
    popup.innerHTML = `<div class="sf-popup">${this._renderPopupBody()}</div>`;
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        this._popup = null;
        this._popupHash = null;
        popup.remove();
      }
    });
    this.shadowRoot.appendChild(popup);
    this._popupHash = newHash;
    this._attachPopupListeners(popup);
  }

  _computePopupHash() {
    // Hash que muda quando o conteúdo do popup muda. Inclui o tipo de popup + estado relevante.
    const type = this._popup;
    const parts = [type];

    if (type === 'speakers') {
      // Estado de seleção + volumes + grouping de cada player
      for (const p of this._players) {
        const s = this._hass.states[p.entity_id];
        const vol = s ? Math.round((s.attributes.volume_level || 0) * 100) : 0;
        const muted = s && s.attributes.is_volume_muted ? 1 : 0;
        const grouped = s && Array.isArray(s.attributes.group_members) && s.attributes.group_members.length > 1 ? 1 : 0;
        const selected = this._selectedSpeakers.includes(p.entity_id) ? 1 : 0;
        parts.push(`${p.entity_id}:${p.state}:${vol}:${muted}:${grouped}:${selected}`);
      }
    } else if (type === 'settings') {
      parts.push(this._players.length, this._providers.length);
    } else if (type === 'search-results') {
      parts.push(this._searchQuery, this._searchInProgress ? 1 : 0,
        this._searchResults ? Object.keys(this._searchResults).map((k) => `${k}:${(this._searchResults[k] || []).length}`).join(',') : 'none');
    } else if (type === 'source' || type === 'source-detail' || type === 'source-favorites') {
      parts.push(JSON.stringify(this._sourceDetailContext || null), JSON.stringify(this._popupData || null));
    } else {
      // popups de listas (playlists, radios, favorites-category)
      parts.push(JSON.stringify(this._popupData || null));
    }

    return parts.join('|');
  }

  _renderPopupBody() {
    switch (this._popup) {
      case 'source': return this._renderSourcePopup();
      case 'source-detail': return this._renderSourceDetailPopup();
      case 'source-provider-category': return this._renderSourceProviderCategoryPopup();
      case 'source-playlists': return this._renderSourcePlaylistsPopup();
      case 'source-radios': return this._renderSourceRadiosPopup();
      case 'source-favorites': return this._renderSourceFavoritesPopup();
      case 'source-favorites-category': return this._renderSourceFavoritesCategoryPopup();
      case 'speakers': return this._renderSpeakersPopup();
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

      case 'select-source-provider': {
        // Pode ser entrada inicial (clicaste num provider) ou back (do popup de categoria)
        if (element.dataset.instanceId) {
          this._sourceDetailContext = {
            kind: 'provider',
            instance_id: element.dataset.instanceId,
            domain: element.dataset.domain,
            name: element.dataset.name,
            gradient: element.dataset.gradient,
          };
        }
        this._popup = 'source-detail';
        await this._loadProviderCategoryCounts();
        break;
      }
      case 'open-provider-category': {
        const cat = element.dataset.category;
        this._popup = 'source-provider-category';
        await this._loadProviderCategory(cat);
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
        // Toggle agora é async e faz join/unjoin imediato em background
        await this._toggleSpeaker(element.dataset.entityId);
        this._renderPopup();
        this._renderModal();
        break;
      case 'select-all-speakers':
        await this._selectAllSpeakers();
        this._renderPopup();
        this._renderModal();
        break;
      case 'speaker-vol-up':
        await adjustVolume(this._hass, [element.dataset.entityId], 0.05);
        this._renderPopup();
        break;
      case 'speaker-vol-down':
        await adjustVolume(this._hass, [element.dataset.entityId], -0.05);
        this._renderPopup();
        break;
      case 'equalize-popup':
        await equalizeVolumes(this._hass, this._getEffectiveSpeakers(), this._equalizeLevel);
        this._renderPopup();
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
    const data = this._popupData || {};
    const counts = data.providerCounts || {};

    let body;
    if (data.loading) {
      body = '<div class="sf-loader">A contar items…</div>';
    } else if (data.error) {
      body = `<div class="sf-empty">${this._esc(data.error)}</div>`;
    } else {
      const categories = [
        { key: 'track',    label: 'Músicas',  subtitle: 'Tocar tudo aleatório ou escolher faixa', icon: 'music' },
        { key: 'album',    label: 'Álbuns',   subtitle: 'Escolher um álbum',                       icon: 'music' },
        { key: 'artist',   label: 'Artistas', subtitle: 'Escolher um artista',                     icon: 'artist' },
        { key: 'playlist', label: 'Playlists', subtitle: 'Escolher uma playlist',                  icon: 'playlist' },
      ];
      body = `
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${categories.map((c) => {
            const n = counts[c.key];
            const subtitleText = n === undefined
              ? c.subtitle
              : (n === 0 ? 'Nada nesta categoria' : (n === 1 ? `1 item` : `${n} items · ${c.subtitle}`));
            const disabled = n === 0;
            // Ícone visual por categoria
            const iconSvg = c.icon === 'music' ? PROVIDER_SVGS.music
              : c.icon === 'playlist' ? ICONS.playlist
              : '<path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/>';
            const iconStroke = c.icon === 'playlist'
              ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">${iconSvg}</svg>`
              : `<svg width="20" height="20" viewBox="0 0 24 24" fill="white">${iconSvg}</svg>`;
            return `
              <div class="sf-list-item ${disabled ? 'sf-disabled' : ''}" ${disabled ? '' : `data-action="open-provider-category" data-category="${c.key}"`}>
                <div class="sf-list-item-icon" style="width:42px;height:42px;background:${def.gradient};">
                  ${iconStroke}
                </div>
                <div class="sf-list-item-content">
                  <div class="sf-list-item-title" style="font-size:15px;">${c.label}</div>
                  <div class="sf-list-item-subtitle">${subtitleText}</div>
                </div>
                ${disabled ? '' : `<svg width="20" height="20" viewBox="0 0 24 24" fill="var(--sf-text-3)" style="flex-shrink:0;">${ICONS.chevron_right}</svg>`}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

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
        <button class="sf-icon-btn sf-circle" style="width:36px;height:36px;" data-action="close-popup">
          <svg width="20" height="20" viewBox="0 0 24 24">${ICONS.close}</svg>
        </button>
      </div>
      ${body}
    `;
  }

  /**
   * Renderiza o popup com a lista de items de uma categoria de um provider.
   * No topo, botão "Tocar tudo aleatório" (só para tracks).
   */
  _renderSourceProviderCategoryPopup() {
    const data = this._popupData || {};
    const ctx = this._sourceDetailContext || {};
    const cat = data.categoryType || 'track';
    const titleMap = { track: 'Músicas', album: 'Álbuns', artist: 'Artistas', playlist: 'Playlists' };
    const def = getProviderDef(ctx.domain);
    const isArtist = cat === 'artist';

    // Cabeçalho com botão "Tocar tudo aleatório" só faz sentido para tracks
    const shuffleAllHtml = (cat === 'track' && data.items && data.items.length > 0) ? `
      <div class="sf-list-item" data-action="play-source-tracks" style="background:${def.gradient};border:none;margin-bottom:10px;">
        <div class="sf-list-item-icon" style="width:42px;height:42px;background:rgba(255,255,255,0.18);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">${ICONS.shuffle_play}</svg>
        </div>
        <div class="sf-list-item-content">
          <div class="sf-list-item-title" style="color:white;font-size:15px;">Tocar tudo aleatório</div>
          <div class="sf-list-item-subtitle" style="color:rgba(255,255,255,0.85);">Até 500 faixas em modo shuffle</div>
        </div>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style="flex-shrink:0;">${ICONS.shuffle_play}</svg>
      </div>
    ` : '';

    return this._renderListPopup({
      title: `${titleMap[cat] || 'Items'} · ${this._esc(def.name)}`,
      backAction: 'select-source-provider',
      data,
      emptyMsg: 'Sem items nesta categoria.',
      renderIcon: (item) => {
        const url = this._getItemImage(item);
        const radius = isArtist ? '50%' : '10px';
        if (url) {
          return `<img src="${this._esc(url)}" style="width:100%;height:100%;object-fit:cover;border-radius:${radius};" onerror="this.style.display='none'">`;
        }
        if (isArtist) {
          return `<svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/></svg>`;
        }
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="white">${PROVIDER_SVGS.music}</svg>`;
      },
      iconBg: isArtist ? 'rgba(123,63,228,0.4)' : def.gradient,
      mediaType: cat,
      headerExtraHtml: shuffleAllHtml,
    });
  }

  // ============================================================
  // SPEAKERS POPUP
  // ============================================================

  _renderSpeakersPopup() {
    const total = this._players.length;
    const activeSel = this._getActiveSelection();
    const playing = this._getPlayingPlayers();
    const isPlaying = playing.length > 0;
    const selected = activeSel.length;
    const allSelected = selected === total && total > 0;
    const allLabel = allSelected
      ? (isPlaying ? '✓ Toda a casa a tocar' : '✓ Toda a casa selecionada')
      : (isPlaying ? 'Adicionar toda a casa' : 'Selecionar toda a casa');

    // Detetar o estado de agrupamento real do HA + identificar o leader implícito
    const groupedIds = new Set();
    for (const p of this._players) {
      const stateObj = this._hass.states[p.entity_id];
      if (!stateObj) continue;
      const members = stateObj.attributes.group_members || [];
      if (Array.isArray(members) && members.length > 1) {
        members.forEach((m) => groupedIds.add(m));
      }
    }
    const implicitLeader = isPlaying
      ? this._findCurrentLeader(playing)
      : this._getImplicitLeader();

    // Subtitle: descrever o estado real
    let subtitle;
    if (selected === 0) {
      subtitle = 'Toque numa coluna para a selecionar';
    } else if (isPlaying) {
      if (selected === 1) {
        const p = this._players.find((x) => x.entity_id === activeSel[0]);
        subtitle = p ? `A tocar em ${this._cleanName(p.friendly_name)}` : '';
      } else if (selected === total) {
        subtitle = 'A tocar em toda a casa · sincronizado';
      } else {
        subtitle = `A tocar em ${selected} colunas · sincronizado`;
      }
    } else {
      // selecionado mas nada toca ainda
      if (selected === 1) {
        const p = this._players.find((x) => x.entity_id === activeSel[0]);
        subtitle = p ? `Próxima música → ${this._cleanName(p.friendly_name)}` : '';
      } else if (selected === total) {
        subtitle = 'Próxima música → toda a casa';
      } else {
        subtitle = `Próxima música → ${selected} colunas`;
      }
    }

    return `
      <div class="sf-popup-header">
        <span class="sf-popup-title">Colunas</span>
        <button class="sf-icon-btn sf-circle" style="width:36px;height:36px;" data-action="close-popup">
          <svg width="20" height="20" viewBox="0 0 24 24">${ICONS.close}</svg>
        </button>
      </div>

      <div style="font-size:11px;color:var(--sf-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">
        ${this._esc(subtitle)}
      </div>

      <button style="width:100%;padding:12px;background:var(--sf-button-bg);border:1px dashed var(--sf-border);border-radius:12px;color:var(--sf-text);font-size:13px;cursor:pointer;margin-bottom:14px;font-family:inherit;" data-action="select-all-speakers">
        ${allLabel}
      </button>

      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;">
        ${this._players.map((p) => this._renderSpeakerRow(p, groupedIds, implicitLeader, activeSel)).join('')}
      </div>

      <button class="sf-equalize" style="width:100%;padding:11px;font-size:12px;border-radius:10px;" data-action="equalize-popup">
        Igualar volume → ${this._config.equalize_volume}%
      </button>
    `;
  }

  _renderSpeakerRow(player, groupedIds = new Set(), implicitLeader = null, activeSel = null) {
    const sel = activeSel || this._getActiveSelection();
    const isSelected = sel.includes(player.entity_id);
    const stateObj = this._hass.states[player.entity_id];
    const volPct = stateObj ? Math.round((stateObj.attributes.volume_level || 0) * 100) : 0;
    const name = this._cleanName(player.friendly_name);
    const isGrouped = groupedIds.has(player.entity_id);
    const isLeader = isSelected && sel.length > 1 && player.entity_id === implicitLeader;

    const stateLabel = player.state === 'playing' ? 'A tocar'
      : player.state === 'paused' ? 'Em pausa'
      : player.state === 'idle' ? 'Inativo' : (player.state || '');
    const subtitle = isLeader ? `${stateLabel} · origem do som`
      : isGrouped ? `${stateLabel} · sincronizado`
      : stateLabel;

    const checkBoxHtml = isSelected
      ? `<div class="sf-speaker-check" style="background:var(--sf-grad);">
           <svg width="14" height="14" viewBox="0 0 24 24">${ICONS.check}</svg>
         </div>`
      : `<div class="sf-speaker-check" style="background:transparent;border:1.5px solid var(--sf-text-3);"></div>`;

    // Toda a linha (incluindo o ícone) agora é clicável para toggle (uniforme)
    const rowBg = isSelected ? 'background:rgba(234,53,114,0.10);border:1px solid rgba(234,53,114,0.30);' : 'background:var(--sf-button-bg);border:1px solid var(--sf-border);';

    return `
      <div style="${rowBg}border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:10px;cursor:pointer;" data-action="toggle-speaker" data-entity-id="${player.entity_id}">
        ${checkBoxHtml}
        <div class="sf-list-item-icon" style="background:rgba(123,63,228,0.25);width:36px;height:36px;flex-shrink:0;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a280ff" stroke-width="2">${ICONS.speaker}</svg>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${this._esc(name)}
            ${isLeader ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--sf-pink);margin-left:6px;vertical-align:middle;box-shadow:0 0 6px var(--sf-pink);"></span>' : ''}
          </div>
          <div style="font-size:11px;color:var(--sf-text-3);">${subtitle}</div>
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

  /**
   * Filtra os items de uma biblioteca para só conter os do provider/instância atual.
   */
  _filterByProvider(items, ctx) {
    if (!ctx || (!ctx.instance_id && !ctx.domain)) return items;
    return items.filter((it) => {
      if (it.provider === ctx.instance_id) return true;
      if (Array.isArray(it.provider_mappings) && it.provider_mappings.some(
        (pm) => pm.provider_instance === ctx.instance_id || pm.provider_domain === ctx.domain
      )) return true;
      return false;
    });
  }

  /**
   * Carrega contagens de items por categoria do provider atual.
   * Mostra "loading" enquanto vai buscando, e a UI atualiza assim que disponível.
   */
  async _loadProviderCategoryCounts() {
    const ctx = this._sourceDetailContext;
    if (!this._maConfigEntryId || !ctx) {
      this._popupData = { error: 'Provider inválido' };
      this._renderPopup();
      return;
    }
    this._popupData = { loading: true };
    this._renderPopup();
    try {
      const types = ['track', 'album', 'artist', 'playlist'];
      const counts = {};
      // Em paralelo, mas com limite mais baixo (só preciso de contar)
      const results = await Promise.all(
        types.map((t) =>
          maGetLibrary(this._hass, this._maConfigEntryId, t, { limit: 500 })
            .then((items) => [t, this._filterByProvider(items, ctx).length])
            .catch(() => [t, 0])
        )
      );
      for (const [t, n] of results) counts[t] = n;
      this._popupData = { providerCounts: counts };
    } catch (e) {
      this._popupData = { error: 'Erro ao carregar categorias' };
    }
    this._renderPopup();
  }

  /**
   * Carrega items de uma categoria específica do provider atual.
   */
  async _loadProviderCategory(mediaType) {
    const ctx = this._sourceDetailContext;
    if (!this._maConfigEntryId || !ctx) {
      this._popupData = { items: [], error: 'Provider inválido' };
      this._renderPopup();
      return;
    }
    this._popupData = { loading: true };
    this._renderPopup();
    try {
      const items = await maGetLibrary(this._hass, this._maConfigEntryId, mediaType, { limit: 500 });
      const filtered = this._filterByProvider(items, ctx);
      this._popupData = { items: filtered, categoryType: mediaType };
    } catch (e) {
      this._popupData = { items: [], error: 'Erro ao carregar' };
    }
    this._renderPopup();
  }

  _renderListPopup(opts) {
    const { title, backAction, data, emptyMsg, renderIcon, iconBg, mediaType, mediaTypeFromItem, headerExtraHtml } = opts;
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
                <div class="sf-list-item-icon" style="width:48px;height:48px;background:${iconBg};">${renderIcon(item)}</div>
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
      ${headerExtraHtml || ''}
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
        const url = this._getItemImage(item);
        if (url) {
          return `<img src="${this._esc(url)}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" onerror="this.style.display='none'">`;
        }
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${PROVIDER_SVGS.radio}</svg>`;
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
    const isArtist = cat === 'artist';
    return this._renderListPopup({
      title: titleMap[cat] || 'Favoritos',
      backAction: 'select-source-favorites',
      data,
      emptyMsg: 'Sem favoritos nesta categoria.',
      renderIcon: (item) => {
        const url = this._getItemImage(item);
        const radius = isArtist ? '50%' : '10px';
        if (url) {
          return `<img src="${this._esc(url)}" style="width:100%;height:100%;object-fit:cover;border-radius:${radius};" onerror="this.style.display='none'">`;
        }
        if (isArtist) {
          return `<svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/></svg>`;
        }
        return this._renderSfWave(18, 'white');
      },
      iconBg: isArtist ? 'rgba(123,63,228,0.4)' : 'var(--sf-grad)',
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
        const url = this._getItemImage(item);
        if (url) {
          return `<img src="${this._esc(url)}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" onerror="this.style.display='none'">`;
        }
        return `<svg width="20" height="20" viewBox="0 0 24 24" fill="white">${PROVIDER_SVGS.music}</svg>`;
      },
      iconBg: 'rgba(123,63,228,0.5)',
      mediaType: 'playlist',
    });
  }

  // ============================================================
  // PLAY ACTIONS
  // ============================================================

  async _playProviderTracks(ctx) {
    const player = this._getPlayTarget();
    if (!player) return;
    this._activePlayer = player;

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

  /**
   * Decide o player onde a próxima música deve começar a tocar.
   * - Se há _selectedSpeakers (memória local): usa o primeiro como leader
   *   (e os outros serão agrupados por _maybeGroupSpeakers depois do play)
   * - Senão: usa o _activePlayer
   * - Senão: nada
   */
  _getPlayTarget() {
    if (this._selectedSpeakers.length > 0) {
      const id = this._selectedSpeakers[0];
      const found = this._players.find((p) => p.entity_id === id);
      if (found) return found;
    }
    return this._activePlayer;
  }

  async _playSelectedItem(uri, mediaType, name) {
    const player = this._getPlayTarget();
    if (!player) return;

    // Atualiza activePlayer para o leader
    this._activePlayer = player;

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
    // Se há seleção temporária (memória local), aplica-a antes do play.
    // Caso contrário, deixa tocar onde já estava (no _activePlayer).
    const ids = this._selectedSpeakers;
    if (ids.length < 2) return;

    // O leader da seleção é o activePlayer se estiver na seleção, senão o primeiro
    const leader = this._activePlayer && ids.includes(this._activePlayer.entity_id)
      ? this._activePlayer.entity_id
      : ids[0];

    try {
      await groupPlayers(this._hass, leader, ids);
      // Garante que o activePlayer reflete o leader (importante para subsequent commands)
      const leaderObj = this._players.find((p) => p.entity_id === leader);
      if (leaderObj) this._activePlayer = leaderObj;
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

  /**
   * Tenta extrair a melhor URL de imagem de um item da MA library/search.
   * Estruturas conhecidas:
   *   - item.image.path           (legacy)
   *   - item.metadata.images[]    (lista de objetos {type,path,...})
   *   - item.images[]             (lista direta de objetos {path})
   */
  _getItemImage(item) {
    if (!item) return null;
    if (item.image && item.image.path) return item.image.path;
    if (Array.isArray(item.metadata?.images) && item.metadata.images.length > 0) {
      // Preferir thumb se existir, senão a primeira
      const thumb = item.metadata.images.find((i) => i.type === 'thumb' || i.type === 'cover');
      return (thumb && thumb.path) || item.metadata.images[0].path || null;
    }
    if (Array.isArray(item.images) && item.images.length > 0) {
      return item.images[0].path || item.images[0].url || null;
    }
    return null;
  }

  _renderSearchItem(item, mediaType) {
    const subtitleParts = [];
    if (item.artists && item.artists.length > 0) subtitleParts.push(item.artists[0].name);
    if (mediaType === 'album' && item.year) subtitleParts.push(item.year);
    const subtitle = subtitleParts.join(' · ');
    const imgUrl = this._getItemImage(item);

    // Para artistas usamos avatar circular, para tracks/álbuns rectangular arredondado
    const isArtist = mediaType === 'artist';
    const iconBorderRadius = isArtist ? '50%' : '10px';
    const iconBg = isArtist ? 'rgba(123,63,228,0.4)' : 'var(--sf-grad)';

    const imgHtml = imgUrl
      ? `<img src="${this._esc(imgUrl)}" style="width:100%;height:100%;object-fit:cover;border-radius:${iconBorderRadius};" onerror="this.style.display='none'">`
      : (isArtist
          ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/></svg>`
          : `<svg width="20" height="20" viewBox="0 0 24 24" fill="white">${PROVIDER_SVGS.music}</svg>`);

    return `
      <div class="sf-list-item" data-action="play-item" data-uri="${this._esc(item.uri)}" data-media-type="${this._esc(mediaType)}" data-name="${this._esc(item.name || '')}" style="margin-bottom:6px;">
        <div class="sf-list-item-icon" style="width:48px;height:48px;border-radius:${iconBorderRadius};background:${iconBg};">${imgHtml}</div>
        <div class="sf-list-item-content">
          <div class="sf-list-item-title">${this._esc(item.name || 'Sem nome')}</div>
          ${subtitle ? `<div class="sf-list-item-subtitle">${this._esc(subtitle)}</div>` : ''}
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--sf-pink)" style="flex-shrink:0;">${ICONS.shuffle_play}</svg>
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
