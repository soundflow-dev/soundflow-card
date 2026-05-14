// Estado derivado do HA: quem está a tocar, leader, membros, seleção activa.

const PLAYING_STATES = new Set(['playing', 'paused', 'on', 'buffering']);

export function getPlayer(hass, entityId) {
  return hass?.states?.[entityId] || null;
}

export function isPlaying(state) {
  return state?.state === 'playing';
}

export function isActive(state) {
  return state && PLAYING_STATES.has(state.state);
}

export function getGroupMembers(hass, entityId) {
  const s = getPlayer(hass, entityId);
  const list = s?.attributes?.group_members || [];
  return Array.isArray(list) ? list.filter(x => x !== entityId) : [];
}

// Devolve o leader actual do grupo onde `entityId` participa, ou null se não está em grupo.
export function findLeader(hass, entityId, allMassPlayers) {
  // Se este player tem group_members → é leader (ou single)
  const me = getPlayer(hass, entityId);
  const myMembers = me?.attributes?.group_members || [];
  if (Array.isArray(myMembers) && myMembers.length > 0) {
    return entityId; // tem filhos → é leader
  }
  // Senão, procura em todos os players quem tem este na sua group_members
  for (const p of allMassPlayers || []) {
    if (p.entity_id === entityId) continue;
    const gm = p.attributes?.group_members || [];
    if (gm.includes(entityId)) return p.entity_id;
  }
  return null;
}

// Devolve { leader, members[] } para o grupo activo derivado do estado actual.
// Convenção HA: o primeiro elemento de `group_members` é sempre o líder do grupo.
// Iterar `allMassPlayers` por ordem (alfabética) e usar o próprio iterado como líder
// elegia mal a coluna (ex.: "Casa de Banho" antes de "Sala") — usar gm[0] respeita
// o coordinator real reportado pelo HA.
export function getActiveGroup(hass, allMassPlayers) {
  const playing = (allMassPlayers || []).filter(p => isActive(hass.states[p.entity_id]));
  for (const p of playing) {
    const gm = p.attributes?.group_members || [];
    if (gm.length > 0) {
      const leader = gm[0];
      // members na ordem fornecida pelo HA (leader em primeiro, depois sync)
      return { leader, members: gm.slice() };
    }
  }
  // Se há um a tocar isolado, esse é o "grupo" de um só
  if (playing.length === 1) {
    return { leader: playing[0].entity_id, members: [playing[0].entity_id] };
  }
  // Caso vários toquem isolados, devolve o primeiro como pseudo-líder
  if (playing.length > 1) {
    return { leader: playing[0].entity_id, members: playing.map(p => p.entity_id) };
  }
  return null;
}

// Last-played player (mais recentemente activo) — para arranque do card.
export function lastPlayedPlayer(hass, allMassPlayers) {
  let best = null, bestTs = 0;
  for (const p of allMassPlayers || []) {
    const s = hass.states[p.entity_id];
    if (!s) continue;
    const ts = Date.parse(s.last_changed || s.last_updated || 0) || 0;
    if (isActive(s) && ts > bestTs) { best = p.entity_id; bestTs = ts; }
  }
  if (best) return best;
  // Senão devolve o primeiro
  return allMassPlayers?.[0]?.entity_id || null;
}

export function getMediaInfo(state) {
  const a = state?.attributes || {};
  return {
    title: a.media_title || a.media_content_id || '',
    artist: a.media_artist || a.media_album_artist || '',
    album: a.media_album_name || '',
    image: a.entity_picture || a.media_image_url || a.album_art || null,
    contentId: a.media_content_id || '',
    duration: Number(a.media_duration) || 0,
    position: Number(a.media_position) || 0,
    positionAt: a.media_position_updated_at ? Date.parse(a.media_position_updated_at) : Date.now(),
    shuffle: !!a.shuffle,
    repeat: a.repeat || 'off',
    muted: !!a.is_volume_muted,
    volume: Number(a.volume_level) || 0,
    contentType: a.media_content_type || ''
  };
}

export function livePosition(info, state) {
  if (!info.duration) return 0;
  if (state?.state !== 'playing') return info.position || 0;
  const elapsed = (Date.now() - info.positionAt) / 1000;
  return Math.min(info.duration, (info.position || 0) + elapsed);
}

export function pickRandomLeader(candidates) {
  if (!candidates || !candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function formatTime(s) {
  s = Math.max(0, Math.floor(s || 0));
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${m}:${ss}`;
}
