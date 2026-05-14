// Music Assistant API — usa serviços do HA com return_response.
// Todas as funções devolvem dados ou null.

let _cachedEntryId = null;
let _cachedMassQueueEntryId = null;
let _cachedMusicProviders = null;
let _cachedMusicProvidersTs = 0;

export async function getMusicAssistantEntryId(hass) {
  if (_cachedEntryId) return _cachedEntryId;
  // 1) Procurar na entity_registry
  try {
    const list = await hass.callWS({ type: 'config/entity_registry/list' });
    if (Array.isArray(list)) {
      for (const e of list) {
        if (e?.platform === 'music_assistant' && e?.config_entry_id) {
          _cachedEntryId = e.config_entry_id;
          return _cachedEntryId;
        }
      }
    }
  } catch (e) {}
  // 2) Pelos config entries directos (se admin)
  try {
    const entries = await hass.callWS({ type: 'config_entries/get', domain: 'music_assistant' });
    if (entries && entries.length) {
      _cachedEntryId = entries[0].entry_id;
      return _cachedEntryId;
    }
  } catch (e) {}
  return null;
}

// === MASS_QUEUE (custom integration droans/mass_queue, opcional) ===
// Usado para chamadas que o serviço music_assistant nativo não expõe (ex.: filtrar
// library tracks por provider). Se a integração não estiver instalada, todas as
// funções aqui devolvem null silenciosamente.

export async function getMassQueueEntryId(hass) {
  if (_cachedMassQueueEntryId) return _cachedMassQueueEntryId;
  try {
    const entries = await hass.callWS({ type: 'config_entries/get', domain: 'mass_queue' });
    if (entries && entries.length) {
      _cachedMassQueueEntryId = entries[0].entry_id;
      return _cachedMassQueueEntryId;
    }
  } catch (e) {}
  return null;
}

export async function massQueueSendCommand(hass, command, data = {}) {
  const entryId = await getMassQueueEntryId(hass);
  if (!entryId) return null;
  const payload = { config_entry_id: entryId, command, data };
  const r = await callServiceWithResponse(hass, 'mass_queue', 'send_command', payload);
  return r?.response ?? r;
}

// Lista de music providers activos no MA (Apple Music Bruno, Maria, tunein, etc.).
// Cache de 60s — providers raramente mudam.
export async function getMusicProviders(hass) {
  if (_cachedMusicProviders && Date.now() - _cachedMusicProvidersTs < 60_000) {
    return _cachedMusicProviders;
  }
  const r = await massQueueSendCommand(hass, 'providers');
  if (!Array.isArray(r)) return [];
  const music = r.filter(p => p?.type === 'music' && p?.available);
  _cachedMusicProviders = music;
  _cachedMusicProvidersTs = Date.now();
  return music;
}

// Drill-down: tracks dum álbum / artista / playlist.
// `kind` ∈ {album, artist, playlist}. Devolve array normalizado de tracks com
// shape { uri, name, artist, album, image, duration, favorite } — pronto para UI.
// O serviço mass_queue é paginado (~15-25 items/page sem campo `limit`), por isso
// loopamos páginas até a resposta vir vazia. Cap defensivo em maxPages para evitar
// loops infinitos em playlists muito grandes (default 10 = ~250 tracks).
export async function getItemTracks(hass, kind, uri, opts = {}) {
  const SERVICE = { album: 'get_album_tracks', artist: 'get_artist_tracks', playlist: 'get_playlist_tracks' }[kind];
  if (!SERVICE) return [];
  const entryId = await getMassQueueEntryId(hass);
  if (!entryId) return [];
  const maxPages = opts.maxPages || 10;
  const all = [];
  let prevSize = -1;
  for (let page = 0; page < maxPages; page++) {
    const data = { config_entry_id: entryId, uri, page };
    const r = await callServiceWithResponse(hass, 'mass_queue', SERVICE, data);
    const items = r?.tracks ?? r?.items ?? [];
    if (!Array.isArray(items) || items.length === 0) break;
    all.push(...items);
    // Se devolveu menos que a página anterior, presumivelmente é a última
    if (prevSize > 0 && items.length < prevSize) break;
    prevSize = items.length;
  }
  return all.map(it => ({
    uri: it.media_content_id || it.uri,
    name: it.media_title || it.name || it.title,
    artist: it.media_artist || it.artist || it.artists?.[0]?.name || '',
    album: it.media_album_name || it.album?.name || '',
    image: it.media_image || it.image || it.metadata?.images?.[0]?.path,
    duration: it.duration,
    favorite: !!it.favorite
  })).filter(t => t.uri);
}

// Adiciona um item (track/album/artist/playlist) à biblioteca via provider.
// `uri` é tipicamente `apple_music://album/X` ou `spotify://track/Y` (catálogo).
// MA escolhe automaticamente a instance de provider correcta (ex.: a primária do
// Apple Music) e devolve o novo `library://...` URI. Idempotente: chamar duas
// vezes não duplica. Devolve true em sucesso.
export async function addToLibrary(hass, uri) {
  const r = await massQueueSendCommand(hass, 'music/library/add_item', { item: uri });
  return !!(r && (r.uri || r.item_id || r.in_library !== false));
}

// Helper síncrono — basta inspeccionar o URI para saber se um item já está na biblioteca.
export function isInLibrary(item) {
  const uri = item?.uri || item?.media_content_id || '';
  return uri.startsWith('library://');
}

// Lista tracks da biblioteca filtradas por provider (apple_music--XXX, builtin, etc.).
// Devolve [] se mass_queue não estiver instalado.
export async function getLibraryTracksByProvider(hass, providerInstanceId, opts = {}) {
  const data = {
    provider: providerInstanceId,
    limit: Math.min(500, opts.limit || 200),
    offset: opts.offset || 0
  };
  if (opts.orderBy) data.order_by = opts.orderBy;
  const r = await massQueueSendCommand(hass, 'music/tracks/library_items', data);
  return Array.isArray(r) ? r : [];
}

// === PLAYERS ===

export function listMassPlayers(hass) {
  const players = [];
  for (const id of Object.keys(hass.states || {})) {
    if (!id.startsWith('media_player.')) continue;
    const s = hass.states[id];
    const a = s?.attributes || {};
    if (a.app_id === 'music_assistant' || 'mass_player_type' in a || 'active_queue' in a) {
      players.push({ entity_id: id, state: s.state, attributes: a, name: a.friendly_name || id });
    }
  }
  players.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return players;
}

// === SERVICE-BASED (return_response) HELPERS ===

async function callServiceWithResponse(hass, domain, service, data, target) {
  // hass.callService supports returnResponse boolean as 6th arg (or via { return_response: true } in newer versions)
  // The proper way in modern HA: use callWS with execute_script.
  try {
    // Try newer signature: hass.callService(domain, service, data, target, false, true)
    const r = await hass.callService(domain, service, data, target, false, true);
    if (r && (r.response || r.service_response)) return r.response || r.service_response;
    if (r && typeof r === 'object') return r;
  } catch (e) {
    // Fallback: callWS with call_service + return_response
  }
  try {
    const msg = { type: 'call_service', domain, service, service_data: data || {}, return_response: true };
    if (target) msg.target = target;
    const r = await hass.callWS(msg);
    return r?.response ?? r?.service_response ?? r;
  } catch (e) { return null; }
}

// === LIBRARY ===

const KIND_TO_MA = {
  playlists: 'playlist',
  albums: 'album',
  artists: 'artist',
  tracks: 'track',
  radios: 'radio',
  radio: 'radio',
  podcasts: 'podcast',
  audiobooks: 'audiobook'
};

export async function getLibrary(hass, _entryId, kind, opts = {}) {
  const entryId = _entryId || await getMusicAssistantEntryId(hass);
  if (!entryId) return [];
  const mediaType = KIND_TO_MA[kind] || kind;
  const data = {
    config_entry_id: entryId,
    media_type: mediaType,
    favorite: !!opts.favorite,
    limit: Math.min(500, opts.limit || 100),
    offset: opts.offset || 0
  };
  if (opts.search) data.search = opts.search;
  if (opts.orderBy) data.order_by = opts.orderBy;
  const r = await callServiceWithResponse(hass, 'music_assistant', 'get_library', data);
  const items = r?.items;
  return Array.isArray(items) ? items : [];
}

// === SEARCH ===

export async function search(hass, _entryId, query, opts = {}) {
  const entryId = _entryId || await getMusicAssistantEntryId(hass);
  if (!entryId) return emptySearch();
  const data = {
    config_entry_id: entryId,
    name: query,
    limit: opts.limit || 50,
    // Por defeito, pesquisar TODO o catálogo (library + provider). Caller pode
    // forçar `libraryOnly: true` para só a biblioteca local.
    library_only: opts.libraryOnly === true
  };
  if (opts.mediaTypes && opts.mediaTypes.length) data.media_type = opts.mediaTypes;
  const r = await callServiceWithResponse(hass, 'music_assistant', 'search', data);
  if (!r) return emptySearch();
  return {
    artists: r.artists || [],
    albums: r.albums || [],
    tracks: r.tracks || [],
    playlists: r.playlists || [],
    radios: r.radio || r.radios || [],
    audiobooks: r.audiobooks || [],
    podcasts: r.podcasts || []
  };
}
function emptySearch() { return { artists: [], albums: [], tracks: [], playlists: [], radios: [], audiobooks: [], podcasts: [] }; }

// === BROWSE (via media_player.browse_media) ===

export async function browse(hass, entityId, contentId = null, contentType = null) {
  const data = {};
  if (contentId !== null) data.media_content_id = contentId;
  if (contentType) data.media_content_type = contentType;
  const r = await callServiceWithResponse(hass, 'media_player', 'browse_media', data, { entity_id: entityId });
  // r is { [entity_id]: result }
  if (!r) return null;
  const v = r[entityId] || Object.values(r)[0];
  return v || null;
}

// === PLAY ===

export async function playMedia(hass, entityId, mediaId, opts = {}) {
  // Activar shuffle ANTES de play_media para que MA shuffle a queue ao formar
  if (opts.shuffle) {
    try { await hass.callService('media_player', 'shuffle_set', { shuffle: true }, { entity_id: entityId }); } catch (e) {}
  }
  const data = { media_id: mediaId };
  if (opts.mediaType) data.media_type = opts.mediaType;
  if (opts.enqueue) data.enqueue = opts.enqueue;
  if (opts.radioMode != null) data.radio_mode = opts.radioMode;
  if (opts.artist) data.artist = opts.artist;
  if (opts.album) data.album = opts.album;
  try {
    await hass.callService('music_assistant', 'play_media', data, { entity_id: entityId });
    return true;
  } catch (e) {
    try {
      await hass.callService('media_player', 'play_media', {
        media_content_id: Array.isArray(mediaId) ? mediaId[0] : mediaId,
        media_content_type: opts.mediaType || 'music',
        enqueue: opts.enqueue === 'add' ? 'add' : 'replace'
      }, { entity_id: entityId });
      return true;
    } catch (err) { return false; }
  }
}

// === PLAYBACK CONTROLS ===

export async function setShuffle(hass, entityId, on) { try { await hass.callService('media_player', 'shuffle_set', { shuffle: !!on }, { entity_id: entityId }); } catch(e){} }
export async function setRepeat(hass, entityId, mode) { try { await hass.callService('media_player', 'repeat_set', { repeat: mode }, { entity_id: entityId }); } catch(e){} }
export async function play(hass, entityId)  { return hass.callService('media_player', 'media_play',  {}, { entity_id: entityId }); }
export async function pause(hass, entityId) { return hass.callService('media_player', 'media_pause', {}, { entity_id: entityId }); }
export async function next(hass, entityId)  { return hass.callService('media_player', 'media_next_track', {}, { entity_id: entityId }); }
export async function prev(hass, entityId)  { return hass.callService('media_player', 'media_previous_track', {}, { entity_id: entityId }); }
export async function setVolume(hass, entityId, level) { return hass.callService('media_player', 'volume_set', { volume_level: clamp01(level) }, { entity_id: entityId }); }
export async function setMute(hass, entityId, mute)    { return hass.callService('media_player', 'volume_mute', { is_volume_muted: !!mute }, { entity_id: entityId }); }

// === GROUPING ===

export async function joinPlayers(hass, leaderId, memberIds) {
  return hass.callService('media_player', 'join', { group_members: memberIds }, { entity_id: leaderId });
}
export async function unjoin(hass, entityId) {
  try {
    return await hass.callService('media_player', 'unjoin', {}, { entity_id: entityId });
  } catch (e) {
    const msg = String(e?.message || e || '');
    // MA recusa unjoin se o player for membro estático dum grupo (ex.: "Casa Toda").
    // Não é falha do card — é configuração do MA. Não inundar consola com erro.
    if (/static member/i.test(msg)) {
      console.info(`SoundFlow: ${entityId} é membro estático dum grupo no MA — unjoin ignorado.`);
      return null;
    }
    throw e;
  }
}
export async function transferQueue(hass, sourceId, destId, autoPlay = true) {
  try {
    await hass.callService('music_assistant', 'transfer_queue', { source_player: sourceId, auto_play: autoPlay }, { entity_id: destId });
    return true;
  } catch (e) { return false; }
}

// === Compat stubs (no-op to avoid breaking older callers) ===
export async function getProviders() { return []; }
export async function callWS(hass, type, payload = {}) { try { return await hass.callWS({ type, ...payload }); } catch (e) { return null; } }
export async function safeWS(hass, type, payload = {}) { return callWS(hass, type, payload); }
export async function callService(hass, domain, service, data = {}, target = {}) { return hass.callService(domain, service, data, target); }

// === Helpers ===

function clamp01(n) { return Math.max(0, Math.min(1, Number(n) || 0)); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
