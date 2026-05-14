import { svgIcon } from '../icons.js';
import { t } from '../i18n.js';
import { providerSvg } from '../providers.js';
import * as MA from '../api/ma.js';

const VIEW_ROOT = 'root';
const VIEW_FAVORITES = 'favorites';
const VIEW_LIBRARY = 'library';
const VIEW_LIST = 'list'; // listing of items inside a chosen kind
const VIEW_PROVIDER_TRACKS = 'provider_tracks'; // música → escolher provider

export async function renderSourcePopup(card, container) {
  const state = card._sourceView || { view: VIEW_ROOT };
  card._sourceView = state;
  const hass = card._hass;

  container.innerHTML = `
    <div class="sf-modal-header sf-with-back">
      ${state.view !== VIEW_ROOT ? `<button class="sf-circle-btn" data-act="back">${svgIcon('back', 18)}</button>` : '<span></span>'}
      <h2>${headerTitle(card, state)}</h2>
      <button class="sf-circle-btn" data-act="close">${svgIcon('close', 18)}</button>
    </div>
    <div id="sf-src-body"><div class="sf-loading">${t(hass, 'loading')} <span class="sf-spinner"></span></div></div>
  `;
  container.querySelector('[data-act="close"]').addEventListener('click', () => card._closeAllPopups());
  const back = container.querySelector('[data-act="back"]');
  if (back) back.addEventListener('click', () => navigateBack(card, container));

  await renderBody(card, container, state);
}

function headerTitle(card, state) {
  const hass = card._hass;
  switch (state.view) {
    case VIEW_FAVORITES: return t(hass, 'favorites');
    case VIEW_LIBRARY: return t(hass, 'library');
    case VIEW_LIST: return state.label || '';
    case VIEW_PROVIDER_TRACKS: return t(hass, 'tracks');
    default: return t(hass, 'choose_source');
  }
}

function navigateBack(card, container) {
  const v = card._sourceView;
  if (!v) return;
  if (v.view === VIEW_LIST || v.view === VIEW_PROVIDER_TRACKS) {
    card._sourceView = { view: v.parentView || VIEW_ROOT };
  } else {
    card._sourceView = { view: VIEW_ROOT };
  }
  renderSourcePopup(card, container);
}

async function renderBody(card, container, state) {
  const body = container.querySelector('#sf-src-body');
  switch (state.view) {
    case VIEW_ROOT:      return renderRoot(card, body);
    case VIEW_FAVORITES: return renderCategoryList(card, body, { favorite: true, parentView: VIEW_FAVORITES });
    case VIEW_LIBRARY:   return renderCategoryList(card, body, { favorite: false, parentView: VIEW_LIBRARY });
    case VIEW_LIST:      return renderItemList(card, body, state);
    case VIEW_PROVIDER_TRACKS: return renderProviderTracks(card, body, state);
  }
}

async function renderRoot(card, body) {
  const hass = card._hass;
  body.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'sf-list';
  list.appendChild(rowItem({
    icon: providerSvg('tunein', 36),
    title: t(hass, 'radios'),
    sub: t(hass, 'radios_subtitle'),
    onClick: () => {
      card._sourceView = { view: VIEW_LIST, kind: 'radios', favorite: true, label: t(hass, 'radios'), parentView: VIEW_ROOT };
      renderSourcePopup(card, card._popupHost());
    }
  }));
  list.appendChild(rowItem({
    icon: providerSvg('builtin', 36),
    title: t(hass, 'favorites'),
    sub: t(hass, 'favorites_subtitle'),
    onClick: () => {
      card._sourceView = { view: VIEW_FAVORITES };
      renderSourcePopup(card, card._popupHost());
    }
  }));
  list.appendChild(rowItem({
    icon: providerSvg('apple_music', 36),
    title: t(hass, 'library'),
    sub: '',
    onClick: () => {
      card._sourceView = { view: VIEW_LIBRARY };
      renderSourcePopup(card, card._popupHost());
    }
  }));
  body.appendChild(list);
}

async function renderCategoryList(card, body, opts) {
  const hass = card._hass;
  const kinds = ['playlists', 'albums', 'artists', 'tracks'];
  const colors = ['apple_music', 'deezer', 'jellyfin', 'tunein'];
  body.innerHTML = `<div class="sf-list" id="sf-cat-list"></div>`;
  const list = body.querySelector('#sf-cat-list');

  // "All tracks shuffle" só faz sentido para a Biblioteca completa
  if (!opts.favorite) {
    list.appendChild(rowItem({
      icon: providerSvg('builtin', 36),
      title: t(hass, 'all_tracks'),
      sub: t(hass, 'all_tracks_subtitle'),
      onClick: () => card._playAllTracksShuffle(),
      iconRight: 'play'
    }));
  }

  kinds.forEach((k, i) => {
    const isTracksInLibrary = k === 'tracks' && !opts.favorite;
    const node = rowItem({
      icon: providerSvg(colors[i], 36),
      title: labelForKind(hass, k),
      sub: '',
      onClick: () => {
        if (isTracksInLibrary) {
          // Biblioteca > Músicas: em vez de listar todas, escolher por provedor
          card._sourceView = { view: VIEW_PROVIDER_TRACKS, parentView: opts.parentView };
        } else {
          card._sourceView = { view: VIEW_LIST, kind: k, favorite: opts.favorite, label: labelForKind(hass, k), parentView: opts.parentView };
        }
        renderSourcePopup(card, card._popupHost());
      }
    });
    list.appendChild(node);
  });
}

async function renderProviderTracks(card, body, state) {
  const hass = card._hass;
  body.innerHTML = `<div class="sf-loading">${t(hass, 'loading')} <span class="sf-spinner"></span></div>`;
  const providers = await MA.getMusicProviders(hass);
  if (!providers || providers.length === 0) {
    body.innerHTML = `<div class="sf-empty">${t(hass, 'no_items')}</div>`;
    return;
  }
  body.innerHTML = `<div class="sf-list" id="sf-prov-list"></div>`;
  const list = body.querySelector('#sf-prov-list');
  // Stream providers em primeiro (apple_music, spotify, etc.), depois builtin/local
  providers.sort((a, b) => {
    const sa = a.is_streaming_provider ? 0 : 1;
    const sb = b.is_streaming_provider ? 0 : 1;
    if (sa !== sb) return sa - sb;
    return (a.name || '').localeCompare(b.name || '');
  });
  providers.forEach(p => {
    const display = providerDisplayName(p);
    list.appendChild(rowItem({
      icon: providerSvg(p.domain || 'builtin', 36),
      title: display,
      sub: t(hass, 'all_tracks_subtitle'),
      iconRight: 'play',
      onClick: () => card._playProviderTracksShuffle(p.instance_id, display)
    }));
  });
}

function providerDisplayName(p) {
  // Para apple_music o "name" do MA é o nome da conta (ex.: "Bruno", "Maria").
  // Prefixar com o domain humanizado para clareza ("Apple Music — Bruno").
  const domainPretty = ({
    apple_music: 'Apple Music',
    spotify: 'Spotify',
    tidal: 'Tidal',
    deezer: 'Deezer',
    qobuz: 'Qobuz',
    ytmusic: 'YT Music',
    builtin: 'Music Assistant',
    tunein: 'TuneIn'
  })[p.domain] || p.domain || 'Provider';
  const name = (p.name || '').trim();
  if (!name || name.toLowerCase() === domainPretty.toLowerCase()) return domainPretty;
  return `${domainPretty} — ${name}`;
}

async function renderItemList(card, body, state) {
  const hass = card._hass;
  body.innerHTML = `<div class="sf-loading">${t(hass, 'loading')} <span class="sf-spinner"></span></div>`;
  const items = await card._getLibrary(state.kind, { favorite: !!state.favorite, limit: 500 });
  if (!items || items.length === 0) {
    body.innerHTML = `<div class="sf-empty">${t(hass, 'no_items')}</div>`;
    return;
  }
  body.innerHTML = `<div class="sf-list" id="sf-items"></div>`;
  const list = body.querySelector('#sf-items');
  const mediaType = state.kind === 'radios' ? 'radio' : state.kind.slice(0, -1); // radios → radio, tracks → track
  const shuffleHint = state.kind === 'playlists' || state.kind === 'tracks';
  items.forEach(it => list.appendChild(mediaItem(card, it, { mediaType, shuffleHint })));
}

function labelForKind(hass, kind) {
  return ({
    playlists: t(hass, 'playlists'),
    albums: t(hass, 'albums'),
    artists: t(hass, 'artists'),
    tracks: t(hass, 'tracks'),
    radios: t(hass, 'radios')
  })[kind] || kind;
}

function rowItem({ icon, title, sub, onClick, iconRight }) {
  const div = document.createElement('button');
  div.className = 'sf-list-item';
  div.innerHTML = `
    <div class="sf-li-icon">${icon}</div>
    <div class="sf-li-body">
      <div class="sf-li-title">${escapeHtml(title || '')}</div>
      ${sub ? `<div class="sf-li-sub">${escapeHtml(sub)}</div>` : ''}
    </div>
    <div class="sf-li-chev">${svgIcon(iconRight || 'chev', 18)}</div>`;
  div.addEventListener('click', onClick);
  return div;
}

function mediaItem(card, it, opts = {}) {
  const div = document.createElement('button');
  div.className = 'sf-list-item';
  const img = it?.image || it?.thumbnail || it?.metadata?.image;
  const title = it.name || it.title || it.uri || '';
  const sub = it.artists?.[0]?.name || it.artist || it.album?.name || '';
  div.innerHTML = `
    <div class="sf-li-icon" style="${img ? `background-image:url(${JSON.stringify(img).slice(1, -1)});` : ''}">${img ? '' : providerSvg('builtin', 30)}</div>
    <div class="sf-li-body">
      <div class="sf-li-title">${escapeHtml(title)}</div>
      ${sub ? `<div class="sf-li-sub">${escapeHtml(sub)}</div>` : ''}
    </div>
    <div class="sf-li-chev">${svgIcon('play', 18)}</div>`;
  div.addEventListener('click', () => card._playMediaItem(it, opts));
  return div;
}

function escapeHtml(s) { return String(s ?? '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c])); }
