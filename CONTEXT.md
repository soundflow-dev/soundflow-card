# SoundFlow Card — Contexto para continuação

## O que é
Card Lovelace personalizado para Home Assistant que controla o **Music Assistant** com estética própria (gradiente magenta→roxo→violeta `#EA3572 → #C729C7 → #7B3FE4`).

## Setup do utilizador (Bruno)
- **Home Assistant** 2026.4.4 com Music Assistant instalado
- **Music Assistant config_entry_id**: `01K77FET0GPMX3QW6433DKQDFD`
- **Players MA**: Sala, Cozinha, Quarto, Escritório, Casa de Banho, Dressing
- **Providers configurados**: Apple Music (Bruno + Maria), TuneIn
- **Sistema**: macOS
- **GitHub**: `soundflow-dev/soundflow-card` (recriado limpo, v0.1.0 publicada)
- **Pasta local**: `~/Desktop/soundflow-card`

## Versão atual
**v0.2.0** (~90 KB minificado)

## Stack
- Web Component nativo (extends HTMLElement) — **sem Lit**, sem dependências runtime
- Build: Rollup + plugin-node-resolve + terser
- Bundle final: `dist/soundflow-card.js`

## Estrutura
```
soundflow-card/
├── src/
│   ├── soundflow-card.js   (~2100 linhas — classe principal)
│   ├── styles.js, providers.js, ma-api.js, editor.js
└── dist/soundflow-card.js
```

## Funcionalidades v0.2.0 — o que mudou face à v0.1.0
1. **Anti-flicker** real em popup e modal: soft refresh em vez de destroy/recreate. Preserva foco e cursor do input de pesquisa.
2. **Auto-group/ungroup**: ao tocar/destocar checkbox de uma coluna, o card chama `media_player.join`/`unjoin` automaticamente em background. Sem botões "Agrupar"/"Desagrupar".
3. **Leader implícito** dinâmico via `_getImplicitLeader()` — heurística: a tocar > volume mais alto > primeiro da lista. Não é armazenado, só calculado.
4. **Tap em qualquer parte da linha** = toggle (uniforme). Pequeno ponto rosa indica de onde sai o som (sem texto "principal").
5. **Volume bar atualiza em tempo real** — `_computeModalHash` inclui volumes de todos os efetivos; popup tem `_computePopupHash` próprio.
6. **Mute global no card principal** — aplica a todas as colunas selecionadas; se nenhuma estiver selecionada, aplica a todas.
7. **% volume visível** na modal grande, ao lado do slider.
8. **Pesquisa com botão lupa** clicável (gradiente rosa) **+ Enter no teclado**, sem auto-search. Botão `×` para limpar.
9. **Capas robustas** nos resultados: helper `_getItemImage()` lê `image.path`, `metadata.images[]` e `images[]`. Avatares circulares para artistas, retangulares para tracks/álbuns.
10. **Provider expandido para 4 categorias navegáveis** (Tracks/Albums/Artists/Playlists) com contagens. Cada uma abre lista filtrada por provider; "Tracks" tem botão "Tocar tudo aleatório" no topo.

## Funcionalidades já existentes (v0.1.0)
- Mini player + modal completo
- Popup "Escolher fonte" com providers detetados via subentries (fallback inferência)
- Popup "Rádios favoritas"
- Popup "Favoritos do MA" — menu por categoria (Playlists / Álbuns / Artistas / Músicas)
- Popup "Definições" — players + providers + Editar config + Re-detetar providers + GitHub
- Editor visual via UI do HA
- Tema dark/light adaptativo

## Notas técnicas importantes
- `music_assistant.get_library`: requer `config_entry_id`, devolve `result.response.items`
- `music_assistant.play_media`: aceita array de URIs em `media_id`
- "Tocar tudo aleatório" filtra até 500 tracks, depois `shuffle_set` true → `play_media` array
- Players MA: `entityRegistry.platform === 'music_assistant'` OU `attributes.mass_player_id`
- Multi-speaker: `media_player.join` / `media_player.unjoin`
- Providers: `config_entries/get` → `entry.subentries[].data.{provider_domain, instance_id}`
- Soft-refresh: `_renderPopup` e `_renderModal` substituem só o conteúdo interno (`<div class="sf-popup">` e `#sf-modal-content`) sem remover o overlay; preserva foco do input de pesquisa
- Auto-grouping: `_syncGrouping()` é idempotente — só executa join/unjoin se diferir do estado atual
- Leader implícito: nunca armazenado, sempre calculado em runtime via `_getImplicitLeader()`

## Onde estávamos
Acabámos de produzir v0.2.0 com 10 correções concretas (1 a 10 acima). Bruno vai testar e reportar.

## Próximos passos previsíveis
- Testar v0.2.0 e iterar bugs
- Polimento de ícones de providers (apple_music_artwork-style)
- Suporte a queues/upcoming
- Virtual scrolling para listas longas (Apple Music tem 1500+ tracks)
- Botão "favoritar" no mini-player
- Possivelmente: paginação/infinite scroll nas listas de provider
