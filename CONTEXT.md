# SoundFlow Card — Contexto para continuação

## O que é
Card Lovelace personalizado para Home Assistant que controla o **Music Assistant** com estética própria (gradiente magenta→roxo→violeta `#EA3572 → #C729C7 → #7B3FE4`).

## Setup do utilizador (Bruno)
- HA 2026.4.4 com Music Assistant; config_entry_id `01K77FET0GPMX3QW6433DKQDFD`
- Players: Sala, Cozinha, Quarto, Escritório, Casa de Banho, Dressing
- Providers: Apple Music (Bruno + Maria), TuneIn
- macOS · GitHub `soundflow-dev/soundflow-card` · Pasta `~/Desktop/soundflow-card`

## Versão atual
**v0.3.1** (~86 KB minificado)

## Stack
- Web Component nativo, sem Lit, sem deps runtime
- Build: Rollup + plugin-node-resolve + terser
- Bundle: `dist/soundflow-card.js`

## Mudanças em v0.3.1 (face a v0.3.0)

### Bug fix crítico: transferência de liderança
- Antes: desselecionar a coluna leader fazia `unjoin` → o MA parava o áudio em todas as outras colunas do grupo (porque o leader é a fonte do stream).
- Agora: `_toggleSpeaker` detecta quando se está a remover o leader e em vez de fazer `unjoin`, chama `groupPlayers(novo_leader, restantes)`. O MA transfere o stream para o novo leader e o antigo sai automaticamente. A música continua nas restantes colunas.
- Fallback: se a transferência falhar, faz unjoin direto (pode parar tudo, mas evita estado inconsistente).

### UX
- Botão de definições removido do header da modal (Bruno preferiu editar via dashboard)
- Popup interno `_renderSettingsPopup` eliminado (código morto)
- Handlers `open-settings`, `reload-providers`, `edit-card` removidos
- Header da modal agora só tem botão fechar à direita (mais limpo)

## Funcionalidades v0.3.0 herdadas (e ativas)
- "Colunas selecionadas" deriva do estado real do HA quando algo está a tocar
- Sincronização entre dispositivos automática via WebSocket do HA
- `_selectedSpeakers` é só memória local temporária para preparar próxima play
- `_getPlayingPlayers()`, `_getActiveSelection()`, `_getPlayTarget()`, `_findCurrentLeader()` são helpers chave
- Toggle no popup colunas faz join/unjoin imediato no servidor

## Funcionalidades v0.2.0 herdadas
- Anti-flicker em popup e modal
- Volume bar e % volume na modal grande
- Mute global afeta todas as selecionadas (ou todas se nenhuma)
- Pesquisa com botão lupa + Enter
- Capas robustas via `_getItemImage()`
- Provider em 4 categorias navegáveis com contagens

## Notas técnicas
- `media_player.join` / `unjoin` são standard do HA; o MA respeita o protocolo
- Group leader detetado por `attributes.group_members.length > 1`
- Transferência de leader: `groupPlayers(novo_leader, lista_restantes)`
- Soft-refresh: `_renderPopup` e `_renderModal` substituem só `<div class="sf-popup">` e `#sf-modal-content`
- Custom elements: `soundflow-card`, `soundflow-card-editor`

## Onde estávamos
v0.3.1 acabada de produzir. Resolve 2 bugs reportados após v0.3.0:
1. ✅ Desselecionar leader parava tudo → transferência de liderança implementada
2. ✅ Botão definições levava ao dashboard editor (não ao card editor) → botão removido conforme decisão do utilizador

## Próximos passos previsíveis
- Testar v0.3.1 e iterar
- Polimento de ícones de providers
- Suporte a queues/upcoming
- Virtual scrolling para listas longas
- Botão "favoritar" no mini-player
