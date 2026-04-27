# SoundFlow Card — Contexto para continuação

## O que é
Card Lovelace personalizado para Home Assistant que controla o **Music Assistant** com estética própria (gradiente magenta→roxo→violeta `#EA3572 → #C729C7 → #7B3FE4`).

## Setup do utilizador (Bruno)
- **Home Assistant** 2026.4.4 com Music Assistant
- **Music Assistant config_entry_id**: `01K77FET0GPMX3QW6433DKQDFD`
- **Players MA**: Sala, Cozinha, Quarto, Escritório, Casa de Banho, Dressing
- **Providers**: Apple Music (Bruno + Maria), TuneIn
- **Sistema**: macOS
- **GitHub**: `soundflow-dev/soundflow-card`
- **Pasta local**: `~/Desktop/soundflow-card`

## Versão atual
**v0.3.0** (~92 KB minificado)

## Stack
- Web Component nativo (extends HTMLElement) — sem Lit, sem deps runtime
- Build: Rollup + plugin-node-resolve + terser
- Bundle final: `dist/soundflow-card.js`

## Estrutura
```
soundflow-card/
├── src/
│   ├── soundflow-card.js   (~2300 linhas)
│   ├── styles.js, providers.js, ma-api.js, editor.js
└── dist/soundflow-card.js
```

## Mudanças em v0.3.0 (face à v0.2.0)

### Refatoração arquitetural: estado derivado do HA
- Conceito novo: **"colunas selecionadas" deriva do estado real do HA quando algo está a tocar**.
- Helpers: `_getPlayingPlayers()`, `_getActiveSelection()`, `_getPlayTarget()`, `_findCurrentLeader()`.
- Sincronização entre dispositivos (browser/telemóvel) é automática via WebSocket do HA — abrir num browser novo e ver imediatamente o que está a tocar.
- `_selectedSpeakers` continua a existir mas só é usada como **memória local temporária** para o caso de nada estar a tocar (preparar a próxima play).

### Toggle inteligente
- `_toggleSpeaker()` agora é async e tem 2 modos:
  - **Modo A (algo a tocar):** toggle faz `media_player.unjoin` ou `media_player.join` imediato no servidor → propaga para todos os dispositivos
  - **Modo B (nada a tocar):** apenas atualiza memória local + `_activePlayer`
- `_selectAllSpeakers()` segue a mesma lógica
- 1 coluna selecionada agora **funciona** porque `_getPlayTarget()` aponta para o leader certo e atualiza `_activePlayer`

### UX
- Botão de definições no header da modal **dispara diretamente edição do card** (em vez de abrir popup interno)
- Pill de "select-player" no canto superior esquerdo da modal **removida** — substituída por um botão de fechar
- Subtitle do popup Colunas dinâmico: "A tocar em..." vs "Próxima música → ..."
- Botão "Selecionar toda a casa" muda para "Adicionar toda a casa" quando algo já toca

### Heurística do leader implícito mais previsível
- Antes: a tocar > volume mais alto > primeiro
- Agora: a tocar > activePlayer (se na seleção) > primeiro

## Funcionalidades v0.2.0 herdadas
- Anti-flicker em popup e modal (soft refresh)
- Volume bar e % volume na modal grande atualizam em tempo real
- Mute global no card principal afeta todas as colunas selecionadas (ou todas se nenhuma)
- Pesquisa com botão lupa + Enter (sem auto-search), botão limpar
- Capas robustas via `_getItemImage()` (avatares circulares para artistas)
- Provider expandido em 4 categorias navegáveis (Tracks/Albums/Artists/Playlists) com contagens

## Notas técnicas
- Estado de play vem do HA via `state === 'playing' || 'paused'`
- Multi-speaker via `media_player.join` / `media_player.unjoin`
- Group leader detetado por `attributes.group_members.length > 1`
- Soft-refresh: `_renderPopup` e `_renderModal` substituem só o conteúdo interno sem remover overlay; preserva foco do search input
- Custom elements: `soundflow-card`, `soundflow-card-editor`

## Onde estávamos
v0.3.0 acabada de produzir. Resolve 5 bugs reportados após teste da v0.2.0:
1. ✅ 1 coluna selecionada não funcionava → `_getPlayTarget()` corrigiu
2. ✅ Leader "aleatório" → heurística previsível
3. ✅ Botão definições agora abre editor do card
4. ✅ Pill "select-player" removida do header da modal
5. ✅ Sincronização entre dispositivos via estado derivado do HA

## Próximos passos previsíveis
- Testar v0.3.0 e iterar
- Polimento de ícones de providers
- Suporte a queues/upcoming
- Virtual scrolling para listas longas
- Botão "favoritar" no mini-player
