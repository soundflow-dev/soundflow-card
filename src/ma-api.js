// ma-api.js - Wrapper para a API WebSocket e serviços do Music Assistant

/**
 * Encontra o config_entry_id do Music Assistant.
 * Usa hass.config_entries se disponível, ou tenta inferir.
 */
export async function findMaConfigEntryId(hass) {
  if (!hass) return null;

  try {
    const entries = await hass.callWS({
      type: 'config_entries/get',
      domain: 'music_assistant',
    });
    if (entries && entries.length > 0) {
      const loaded = entries.find((e) => e.state === 'loaded');
      return (loaded || entries[0]).entry_id;
    }
  } catch (e) {
    // ignore
  }

  // Fallback: tentar via player config_entries
  for (const entityId in hass.states) {
    if (entityId.startsWith('media_player.')) {
      const stateObj = hass.states[entityId];
      if (stateObj.attributes && stateObj.attributes.mass_player_id) {
        // Este é um player MA
        const entry = hass.entities && hass.entities[entityId];
        if (entry && entry.config_entry_id) return entry.config_entry_id;
      }
    }
  }

  return null;
}

/**
 * Lista todos os media players geridos pelo Music Assistant.
 * Retorna array de { entity_id, name, friendly_name, state }.
 */
export function getMaPlayers(hass) {
  if (!hass) return [];

  const players = [];
  const entityRegistry = hass.entities || {};

  for (const entityId in hass.states) {
    if (!entityId.startsWith('media_player.')) continue;
    const stateObj = hass.states[entityId];
    const entityEntry = entityRegistry[entityId];

    // Verifica se pertence à integração music_assistant
    const isMaPlayer =
      (entityEntry && entityEntry.platform === 'music_assistant') ||
      (stateObj.attributes && stateObj.attributes.mass_player_id) ||
      (stateObj.attributes &&
        stateObj.attributes.app_name === 'Music Assistant');

    if (!isMaPlayer) continue;

    players.push({
      entity_id: entityId,
      name: stateObj.attributes.friendly_name || entityId,
      friendly_name: stateObj.attributes.friendly_name || entityId,
      state: stateObj.state,
      attributes: stateObj.attributes,
    });
  }

  return players.sort((a, b) => a.friendly_name.localeCompare(b.friendly_name));
}

/**
 * Determina o player ativo (a tocar) ou retorna o primeiro disponível.
 */
export function getActivePlayer(hass, players, preferredId) {
  if (!players || players.length === 0) return null;

  if (preferredId) {
    const preferred = players.find((p) => p.entity_id === preferredId);
    if (preferred) return preferred;
  }

  // 1. Player a tocar
  const playing = players.find((p) => p.state === 'playing');
  if (playing) return playing;

  // 2. Player em pausa
  const paused = players.find((p) => p.state === 'paused');
  if (paused) return paused;

  // 3. Player idle/ligado
  const idle = players.find(
    (p) => p.state === 'idle' || p.state === 'on'
  );
  if (idle) return idle;

  return players[0];
}

/**
 * Lista os providers de música configurados (instances).
 *
 * Estratégia em camadas:
 * 1. Tentar serviços/WS específicos do MA se existirem
 * 2. Inferir a partir do config_entries (subentries do MA contêm os providers)
 * 3. Fallback: inferir a partir dos próprios dados da biblioteca
 */
export async function getMaProviders(hass, configEntryId) {
  if (!hass || !configEntryId) return [];

  const found = new Map(); // instance_id -> { instance_id, domain, name }

  // === ESTRATÉGIA 1: WebSocket direto ao MA ===
  // O MA expõe `mass/config/providers/get_all` em algumas versões
  try {
    const wsRes = await hass.callWS({
      type: 'execute_script',
      sequence: [],
    }).catch(() => null);
    // (placeholder — não confiável, salta para próxima estratégia)
  } catch (e) { /* ignore */ }

  // === ESTRATÉGIA 2: Subentries do config_entry ===
  // No MA moderno, cada provider é uma subentry do config_entry principal
  try {
    const entries = await hass.callWS({
      type: 'config_entries/get',
      domain: 'music_assistant',
    });
    const entry = (entries || []).find((e) => e.entry_id === configEntryId);
    if (entry && Array.isArray(entry.subentries) && entry.subentries.length > 0) {
      for (const sub of entry.subentries) {
        // subentry.data costuma ter: {provider_type, provider_domain, instance_id, ...}
        const data = sub.data || {};
        const instanceId = data.instance_id || sub.subentry_id;
        const domain = data.provider_domain || data.domain;
        const name = sub.title || data.name || '';
        if (instanceId && domain) {
          if (!found.has(instanceId)) {
            found.set(instanceId, { instance_id: instanceId, domain, name });
          }
        }
      }
    }
  } catch (e) { /* ignore - tentar próxima estratégia */ }

  // === ESTRATÉGIA 3: Inferência via biblioteca ===
  // Só se a estratégia 2 não encontrou nada
  if (found.size === 0) {
    const types = ['playlist', 'track', 'radio', 'album'];
    for (const mediaType of types) {
      try {
        const result = await hass.callService(
          'music_assistant',
          'get_library',
          {
            config_entry_id: configEntryId,
            media_type: mediaType,
            limit: 200,
          },
          undefined,
          false,
          true
        );
        const items =
          result && result.response && result.response.items
            ? result.response.items
            : [];

        for (const item of items) {
          if (item.provider) {
            const instanceId = item.provider;
            let domain = instanceId.split('--')[0];

            if (Array.isArray(item.provider_mappings) && item.provider_mappings.length > 0) {
              const match = item.provider_mappings.find(
                (pm) => pm.provider_instance === instanceId
              );
              if (match && match.provider_domain) {
                domain = match.provider_domain;
              }
            }

            if (!found.has(instanceId)) {
              found.set(instanceId, { instance_id: instanceId, domain, name: '' });
            }
          }

          if (Array.isArray(item.provider_mappings)) {
            for (const pm of item.provider_mappings) {
              const id = pm.provider_instance;
              if (id && !found.has(id)) {
                found.set(id, {
                  instance_id: id,
                  domain: pm.provider_domain || id.split('--')[0],
                  name: '',
                });
              }
            }
          }
        }
      } catch (e) {
        console.warn('[SoundFlow] get_library failed for', mediaType, e);
      }
    }
  }

  // Embelezar nomes para múltiplas contas do mesmo domínio
  const byDomain = {};
  for (const p of found.values()) {
    if (!byDomain[p.domain]) byDomain[p.domain] = [];
    byDomain[p.domain].push(p);
  }

  for (const domain in byDomain) {
    const list = byDomain[domain];
    if (list.length > 1) {
      // Múltiplas contas — preservar nome se já existe (vem da subentry), senão "Conta N"
      list.forEach((p, idx) => {
        if (!p.name) p.name = `Conta ${idx + 1}`;
      });
    }
  }

  return Array.from(found.values());
}

/**
 * Filtra providers que são fontes de música (não controllers de players).
 */
export function filterMusicProviders(providers) {
  if (!Array.isArray(providers)) return [];
  const musicDomains = [
    'apple_music', 'spotify', 'tidal', 'qobuz', 'deezer',
    'ytmusic', 'youtube_music', 'tunein', 'radiobrowser',
    'soundcloud', 'plex', 'jellyfin', 'subsonic',
    'filesystem_smb', 'filesystem_local',
  ];
  return providers.filter((p) => {
    const domain = (p.domain || '').toLowerCase();
    return musicDomains.includes(domain);
  });
}

/**
 * Chama um serviço do Music Assistant.
 */
export async function callMaService(hass, service, data, target) {
  return hass.callService('music_assistant', service, data, target, false);
}

/**
 * Toca um item (URI ou folder) num player com modo aleatório.
 */
export async function playMedia(hass, entityId, mediaId, mediaType, options = {}) {
  const data = {
    media_id: mediaId,
  };
  if (mediaType) data.media_type = mediaType;
  if (options.enqueue) data.enqueue = options.enqueue;
  if (options.radio_mode) data.radio_mode = true;
  return callMaService(hass, 'play_media', data, { entity_id: entityId });
}

/**
 * Igualar volumes entre múltiplos players para um valor (0..1).
 */
export async function equalizeVolumes(hass, entityIds, level) {
  const value = Math.max(0, Math.min(1, level));
  const promises = entityIds.map((id) =>
    hass.callService(
      'media_player',
      'volume_set',
      { volume_level: value },
      { entity_id: id }
    )
  );
  return Promise.all(promises);
}

/**
 * Aumentar/diminuir volume agrupado.
 */
export async function adjustVolume(hass, entityIds, delta) {
  const promises = entityIds.map((id) => {
    const stateObj = hass.states[id];
    const current = stateObj && stateObj.attributes
      ? stateObj.attributes.volume_level || 0
      : 0;
    const newVal = Math.max(0, Math.min(1, current + delta));
    return hass.callService(
      'media_player',
      'volume_set',
      { volume_level: newVal },
      { entity_id: id }
    );
  });
  return Promise.all(promises);
}

/**
 * Mute toggle para múltiplos players.
 */
export async function toggleMute(hass, entityIds) {
  // Se algum não estiver muted, mutar todos. Senão, unmute todos.
  const anyUnmuted = entityIds.some((id) => {
    const s = hass.states[id];
    return s && !s.attributes.is_volume_muted;
  });
  const promises = entityIds.map((id) =>
    hass.callService(
      'media_player',
      'volume_mute',
      { is_volume_muted: anyUnmuted },
      { entity_id: id }
    )
  );
  return Promise.all(promises);
}

/**
 * Agrupar players (sincronização real do MA).
 * O MA usa o serviço media_player.join para agrupar.
 */
export async function groupPlayers(hass, leaderId, memberIds) {
  if (!memberIds || memberIds.length === 0) return;
  return hass.callService(
    'media_player',
    'join',
    { group_members: memberIds.filter((id) => id !== leaderId) },
    { entity_id: leaderId }
  );
}

/**
 * Desagrupar todos os players de um grupo.
 */
export async function unjoinPlayer(hass, entityId) {
  return hass.callService(
    'media_player',
    'unjoin',
    {},
    { entity_id: entityId }
  );
}

/**
 * Pesquisa via Music Assistant.
 */
export async function maSearch(hass, configEntryId, searchQuery, mediaType, libraryOnly = false) {
  const data = {
    config_entry_id: configEntryId,
    name: searchQuery,
    limit: 25,
  };
  if (mediaType) data.media_type = mediaType;
  if (libraryOnly) data.library_only = true;

  try {
    const result = await hass.callService(
      'music_assistant',
      'search',
      data,
      undefined,
      false,
      true
    );
    return result && result.response ? result.response : null;
  } catch (e) {
    console.warn('[SoundFlow] Search error:', e);
    return null;
  }
}

/**
 * Obter conteúdos da biblioteca (favoritos).
 */
export async function maGetLibrary(hass, configEntryId, mediaType, options = {}) {
  const data = {
    config_entry_id: configEntryId,
    media_type: mediaType,
    limit: options.limit || 50,
  };
  if (options.favorite !== undefined) data.favorite = options.favorite;
  if (options.search) data.search = options.search;
  if (options.order_by) data.order_by = options.order_by;

  try {
    const result = await hass.callService(
      'music_assistant',
      'get_library',
      data,
      undefined,
      false,
      true
    );
    return result && result.response && result.response.items
      ? result.response.items
      : [];
  } catch (e) {
    console.warn('[SoundFlow] Library error:', e);
    return [];
  }
}
