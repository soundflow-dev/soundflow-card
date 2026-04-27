// editor.js - Editor visual da configuração do SoundFlow Card

class SoundFlowCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;

    // Barreira contra Assist do HA roubar teclas em inputs
    const stopKb = (e) => {
      const target = e.composedPath ? e.composedPath()[0] : e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        e.stopPropagation();
      }
    };
    this.shadowRoot.addEventListener('keydown', stopKb, true);
    this.shadowRoot.addEventListener('keyup', stopKb, true);
    this.shadowRoot.addEventListener('keypress', stopKb, true);
  }

  setConfig(config) {
    this._config = { ...config };
    if (!this._rendered) this._render();
  }

  set hass(hass) {
    const wasNull = !this._hass;
    this._hass = hass;
    if (wasNull && !this._rendered) this._render();
  }

  _render() {
    if (!this._hass) return;
    this._rendered = true;

    const players = this._getMaPlayers();
    const selectedPlayers = this._config.players || [];

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 8px;
          font-family: var(--paper-font-body1_-_font-family);
          color: var(--primary-text-color);
        }
        .row {
          display: flex;
          flex-direction: column;
          margin-bottom: 16px;
        }
        label {
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 6px;
        }
        .help {
          font-size: 11px;
          color: var(--secondary-text-color);
          margin-top: 4px;
        }
        input[type="text"], input[type="number"], select {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid var(--divider-color);
          border-radius: 6px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font-family: inherit;
          font-size: 14px;
          box-sizing: border-box;
        }
        input[type="checkbox"] {
          margin-right: 6px;
        }
        .checkbox-row {
          display: flex;
          align-items: center;
          padding: 6px 0;
        }
        .player-list {
          max-height: 220px;
          overflow-y: auto;
          padding: 8px;
          border: 1px solid var(--divider-color);
          border-radius: 6px;
        }
        .player-item {
          display: flex;
          align-items: center;
          padding: 4px 0;
          font-size: 13px;
        }
        h3 {
          margin: 8px 0;
          font-size: 14px;
          color: var(--secondary-text-color);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      </style>

      <div class="row">
        <label for="title">Título do card</label>
        <input id="title" type="text" value="${this._esc(this._config.title || '')}" placeholder="(opcional)">
        <span class="help">Aparece no topo do mini player. Deixa em branco para esconder.</span>
      </div>

      <div class="row">
        <label for="default_player">Player por defeito</label>
        <select id="default_player">
          <option value="">Auto (último a tocar)</option>
          ${players
            .map(
              (p) => `
            <option value="${p.entity_id}" ${
                this._config.default_player === p.entity_id ? 'selected' : ''
              }>
              ${this._esc(p.friendly_name)}
            </option>
          `
            )
            .join('')}
        </select>
        <span class="help">Player apresentado quando nenhum estiver a tocar.</span>
      </div>

      <div class="row">
        <label for="equalize_volume">Volume "igualar" (%)</label>
        <input id="equalize_volume" type="number" min="0" max="100" step="1" value="${this._config.equalize_volume ?? 2}">
        <span class="help">Valor do botão "Igualar volume". Default: 2%.</span>
      </div>

      <div class="row">
        <div class="checkbox-row">
          <input id="hide_radio_search" type="checkbox" ${this._config.hide_radio_search !== false ? 'checked' : ''}>
          <label for="hide_radio_search" style="margin:0;font-weight:400;">Esconder pesquisa em modo rádio</label>
        </div>
      </div>

      <h3>Players visíveis (${selectedPlayers.length || players.length} selecionados)</h3>
      <div class="row">
        <span class="help" style="margin-bottom:8px;">Limita quais players do Music Assistant aparecem no card. Sem seleção = todos.</span>
        <div class="player-list">
          ${
            players.length === 0
              ? '<div class="help">Nenhum player do Music Assistant detectado.</div>'
              : players
                  .map(
                    (p) => `
            <label class="player-item">
              <input type="checkbox"
                data-player="${p.entity_id}"
                ${selectedPlayers.includes(p.entity_id) ? 'checked' : ''}>
              ${this._esc(p.friendly_name)} <span style="color:var(--secondary-text-color);margin-left:6px;">(${this._esc(p.entity_id)})</span>
            </label>
          `
                  )
                  .join('')
          }
        </div>
      </div>
    `;

    this._attachListeners();
  }

  _attachListeners() {
    const root = this.shadowRoot;

    root.getElementById('title').addEventListener('input', (e) => {
      this._update('title', e.target.value || undefined);
    });

    root.getElementById('default_player').addEventListener('change', (e) => {
      this._update('default_player', e.target.value || undefined);
    });

    root.getElementById('equalize_volume').addEventListener('change', (e) => {
      const v = parseFloat(e.target.value);
      this._update('equalize_volume', isNaN(v) ? 2 : v);
    });

    root.getElementById('hide_radio_search').addEventListener('change', (e) => {
      this._update('hide_radio_search', e.target.checked);
    });

    root.querySelectorAll('input[data-player]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const checked = root.querySelectorAll('input[data-player]:checked');
        const players = Array.from(checked).map((c) => c.dataset.player);
        this._update('players', players.length > 0 ? players : undefined);
      });
    });
  }

  _update(key, value) {
    if (value === undefined || value === '' || value === null) {
      delete this._config[key];
    } else {
      this._config[key] = value;
    }
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _getMaPlayers() {
    if (!this._hass) return [];
    const players = [];
    const reg = this._hass.entities || {};

    for (const id in this._hass.states) {
      if (!id.startsWith('media_player.')) continue;
      const state = this._hass.states[id];
      const entry = reg[id];
      const isMA =
        (entry && entry.platform === 'music_assistant') ||
        (state.attributes && state.attributes.mass_player_id);
      if (!isMA) continue;
      players.push({
        entity_id: id,
        friendly_name: state.attributes.friendly_name || id,
      });
    }
    return players.sort((a, b) =>
      a.friendly_name.localeCompare(b.friendly_name)
    );
  }

  _esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

customElements.define('soundflow-card-editor', SoundFlowCardEditor);
