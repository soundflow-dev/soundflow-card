import { svgIcon } from '../icons.js';
import { t } from '../i18n.js';
import { providerSvg } from '../providers.js';

export function renderSearchResults(card, container, results) {
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
