import { svgIcon } from '../icons.js';
import { t, plural } from '../i18n.js';
import { providerSvg } from '../providers.js';

// Vista de pesquisa em 2 níveis:
//  - 'sections' (default): mostra categorias com contadores (Músicas (N), Álbuns (N), …)
//  - 'list':               mostra apenas os items da categoria escolhida
// O state vive em `card._searchView = { view, kind? }` para sobreviver a re-renders.
const SECTIONS = [
  { key: 'tracks',    icon: 'music' },
  { key: 'albums',    icon: 'album' },
  { key: 'artists',   icon: 'artist' },
  { key: 'playlists', icon: 'playlist' },
  { key: 'radios',    icon: 'radio' }
];
const DRILLDOWN_KINDS = new Set(['albums', 'artists', 'playlists']);

export function renderSearchResults(card, container, results) {
  const hass = card._hass;
  const view = card._searchView || { view: 'sections' };
  // Migrate stale views back to 'sections' if the kind has 0 results.
  if (view.view === 'list' && !(results[view.kind] || []).length) {
    card._searchView = { view: 'sections' };
  }
  const v = card._searchView || { view: 'sections' };

  if (v.view === 'list') return renderItemsView(card, container, results, v.kind);
  return renderSectionsView(card, container, results);
}

function renderSectionsView(card, container, results) {
  const hass = card._hass;
  const counts = SECTIONS.map(s => ({ ...s, count: (results[s.key] || []).length, label: t(hass, s.key) }));
  const total = counts.reduce((a, b) => a + b.count, 0);

  let html = `
    <div class="sf-modal-header sf-with-back">
      <button class="sf-circle-btn" data-act="back">${svgIcon('back', 18)}</button>
      <h2>${escapeHtml(results._query || '')}</h2>
      <button class="sf-circle-btn" data-act="close">${svgIcon('close', 18)}</button>
    </div>`;

  if (total === 0) {
    html += `<div class="sf-empty">${t(hass, 'no_results')}</div>`;
    container.innerHTML = html;
    wireHeader(card, container, /*backToSections*/ false);
    return;
  }

  html += `<div class="sf-list">`;
  for (const s of counts) {
    if (!s.count) continue; // esconder secções vazias
    html += `
      <button class="sf-list-item" data-sec="${s.key}">
        <div class="sf-li-icon sf-li-icon-tinted">${svgIcon(s.icon, 28)}</div>
        <div class="sf-li-body">
          <div class="sf-li-title">${escapeHtml(s.label)}</div>
          <div class="sf-li-sub">${plural(card._hass, s.count, 'one_result', 'n_results')}</div>
        </div>
        <div class="sf-li-chev">${svgIcon('chev', 18)}</div>
      </button>`;
  }
  html += `</div>`;

  container.innerHTML = html;
  wireHeader(card, container, /*backToSections*/ false);
  container.querySelectorAll('[data-sec]').forEach(node => {
    node.addEventListener('click', () => {
      card._searchView = { view: 'list', kind: node.dataset.sec };
      card._renderPopup();
    });
  });
}

function renderItemsView(card, container, results, kind) {
  const hass = card._hass;
  const label = t(hass, kind) || kind;
  const items = results[kind] || [];
  const shown = items.slice(0, 50);
  const cap = items.length > shown.length ? ` <span class="sf-section-count">(${shown.length}/${items.length})</span>` : '';

  let html = `
    <div class="sf-modal-header sf-with-back">
      <button class="sf-circle-btn" data-act="back">${svgIcon('back', 18)}</button>
      <h2>${escapeHtml(label)}${cap}</h2>
      <button class="sf-circle-btn" data-act="close">${svgIcon('close', 18)}</button>
    </div>
    <div class="sf-li-sub" style="margin: -4px 4px 8px; font-size: 12px;">${escapeHtml(results._query || '')}</div>
    <div class="sf-list" data-sec="${kind}">`;
  for (const it of shown) html += searchItemHtml(it, kind);
  html += `</div>`;

  container.innerHTML = html;
  wireHeader(card, container, /*backToSections*/ true);

  const sec = container.querySelector(`[data-sec="${kind}"]`);
  [...sec.querySelectorAll('.sf-list-item')].forEach((node, idx) => {
    const it = items[idx];
    const mediaType = kind.slice(0, -1); // tracks → track
    node.addEventListener('click', () => {
      if (DRILLDOWN_KINDS.has(kind) && it?.uri) card._openMediaDetails(it, mediaType);
      else card._playMediaItem(it, { mediaType });
    });
  });
}

function wireHeader(card, container, backToSections) {
  container.querySelector('[data-act="close"]').addEventListener('click', () => card._closeAllPopups());
  container.querySelector('[data-act="back"]').addEventListener('click', () => {
    if (backToSections) {
      card._searchView = { view: 'sections' };
      card._renderPopup();
    } else {
      // sair da pesquisa — volta ao modal
      card._searchView = null;
      card._renderModal();
    }
  });
}

function searchItemHtml(it, kind) {
  const img = it?.image || it?.metadata?.image || it?.images?.[0]?.path;
  const title = it.name || it.title || it.uri || '';
  const sub = it.artist || it.artists?.[0]?.name || it.album?.name || it.subtitle || '';
  const isDrill = DRILLDOWN_KINDS.has(kind);
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
