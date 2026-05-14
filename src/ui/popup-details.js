import { svgIcon } from '../icons.js';
import { t } from '../i18n.js';
import { providerSvg } from '../providers.js';
import * as MA from '../api/ma.js';

// Drill-down popup: mostra header dum álbum/artista/playlist + lista das suas tracks.
// `card._detailsView` = { kind: 'album'|'artist'|'playlist', item: {...} }
export async function renderDetailsPopup(card, container) {
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
  const tracks = await MA.getItemTracks(hass, kind, item.uri);
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
    const inLib = MA.isInLibrary(tr) || tr._addedToLibrary;
    const addBtn = inLib ? '' : `<div class="sf-li-add" data-act="add" title="${escapeHtml(t(hass, 'add_to_library'))}">${svgIcon('plus', 16)}</div>`;
    row.innerHTML = `
      <div class="sf-li-icon" style="${tr.image ? `background-image:url(${JSON.stringify(tr.image).slice(1, -1)});` : ''}">${tr.image ? '' : `<span class="sf-li-idx">${idx + 1}</span>`}</div>
      <div class="sf-li-body">
        <div class="sf-li-title">${escapeHtml(tr.name || '')}</div>
        ${(tr.artist || tr.album) ? `<div class="sf-li-sub">${escapeHtml([tr.artist, kind !== 'album' ? tr.album : ''].filter(Boolean).join(' · '))}</div>` : ''}
      </div>
      ${addBtn}
      <div class="sf-li-chev">${svgIcon('play', 18)}</div>`;
    // Click no "+" → add à library; não dispara o action principal
    const addNode = row.querySelector('[data-act="add"]');
    if (addNode) {
      addNode.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        const ok = await MA.addToLibrary(card._hass, tr.uri);
        if (ok) {
          tr._addedToLibrary = true;
          addNode.remove();
          card._toast(t(hass, 'added_to_library'));
        } else {
          card._toast(t(hass, 'add_failed'));
        }
      });
    }
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
