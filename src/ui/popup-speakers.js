import { svgIcon } from '../icons.js';
import { t } from '../i18n.js';
import * as ST from '../api/state.js';

export function renderSpeakersPopup(card, container) {
  const hass = card._hass;
  const visible = card._visiblePlayers();
  const active = ST.getActiveGroup(hass, card._allMassPlayers()) || { leader: null, members: [] };
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
  const playing = ST.isPlaying(s);
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
