# SoundFlow Card — Contexto para continuação

## O que é
Card Lovelace personalizado para Home Assistant que controla o **Music Assistant** com estética própria (gradiente magenta→roxo→violeta `#EA3572 → #C729C7 → #7B3FE4`).

## Setup do utilizador (Bruno)
- **Home Assistant** 2026.4.4 com Music Assistant instalado
- **Music Assistant config_entry_id**: `01K77FET0GPMX3QW6433DKQDFD`
- **Players MA**: Sala, Cozinha, Quarto, Escritório, Casa de Banho, Dressing
- **Providers configurados**: Apple Music (Bruno + Maria), TuneIn
- **Sistema**: macOS
- **GitHub**: `soundflow-dev/soundflow-card`
- **Pasta local**: `~/Desktop/soundflow-card`

## Versão atual
**v0.1.0** — primeira release pública (instalação limpa, repo recriado de raiz)

## Stack
- Web Component nativo (extends HTMLElement) — **sem Lit**, sem dependências runtime
- Build: Rollup + plugin-node-resolve + terser
- Bundle final: `dist/soundflow-card.js` (~82 KB minificado)

## Estrutura do projeto
```
soundflow-card/
├── hacs.json
├── README.md
├── info.md
├── LICENSE  (MIT)
├── .gitignore
├── package.json
├── package-lock.json
├── rollup.config.js
├── assets/  (logos)
├── src/
│   ├── soundflow-card.js   (~1700 linhas — classe principal consolidada)
│   ├── styles.js           (CSS partilhado + ICONS dict + logo SVG)
│   ├── providers.js        (PROVIDER_DEFS + PROVIDER_SVGS)
│   ├── ma-api.js           (wrapper WebSocket/services do MA)
│   └── editor.js           (editor visual de configuração)
└── dist/
    └── soundflow-card.js   (bundle final)
```

## Funcionalidades v0.1.0
- Mini player no dashboard (artwork + título + artista + sala + 3 botões)
- Modal completo (artwork grande, controlos shuffle/prev/play/next/repeat, source/speakers buttons, search, volume +/−/mute, igualar volume)
- Popup "Escolher fonte" — descobre providers via `subentries` do config_entry, fallback inferência via biblioteca
- Popup "Source detail" → Tracks (aleatório) + Playlists
- Popup "Rádios favoritas" — lê favoritos de tipo radio
- Popup "Favoritos do MA" — **menu de categorias** (Playlists / Álbuns / Artistas / Músicas) com contagem; cada categoria abre lista própria
- Popup **unificado** "Player & Colunas" (substitui o antigo split Player ativo + Colunas)
  - Cada linha: checkbox para sincronizar + tap para definir como principal
  - Botões "Agrupar selecionadas" / "Desagrupar tudo" (executa `media_player.join`/`unjoin` imediatamente)
  - Volume individual + igualar volume
  - Indicador "sincronizado" no subtitle (lê `group_members`)
- Popup "Definições" — players + providers + botões "Re-detetar providers" / "Editar configuração" / "GitHub ↗"
- Popup "Search results" — pesquisa com debounce 600ms, mínimo 3 chars
- Editor visual via UI do HA
- Tema dark/light adaptativo via CSS vars do HA

## Características técnicas (em v0.1.0)
- **Anti-flicker**: `_computeRenderHash()` evita re-renders desnecessários a cada `set hass`. Barra de progresso atualizada in-place.
- **Barreira de keyboard**: shadow root intercepta keydown/keyup/keypress em inputs antes de chegarem ao Assist.
- **Deteção de providers em camadas**:
  - Camada 1: `config_entries/get` → `entry.subentries` (modo moderno do MA)
  - Camada 2: fallback inferência via `get_library` (limit 200 por tipo)
  - Botão "Re-detetar providers" nas Definições para forçar refresh
- **Logo nas listas**: helper `_renderSfWave(size, color)` desenha a onda do logo em SVG stroke
- **Search**: debounce 600ms, mínimo 3 chars

## Notas técnicas importantes
- `music_assistant.get_library`: requer `config_entry_id`, devolve `result.response.items`
- `music_assistant.play_media`: aceita array de URIs em `media_id`
- "Tocar tudo aleatório": `media_player.shuffle_set` true → `play_media` com array
- Players MA: `entityRegistry.platform === 'music_assistant'` OU `attributes.mass_player_id`
- Multi-speaker: `media_player.join` / `media_player.unjoin`
- Providers: `config_entries/get` → `entry.subentries[].data.{provider_domain, instance_id}`
- Custom elements: `soundflow-card`, `soundflow-card-editor`

## Avisos dados ao utilizador
- "Tocar tudo aleatório" filtra até 500 tracks da biblioteca (lento em bibliotecas grandes)
- Providers menos comuns caem em ícone genérico
- "Editar configuração" depende de o dashboard estar em modo edit (Lovelace)

## Onde estávamos
Bruno apagou a instalação antiga (HA + GitHub) e está a criar repo limpo a partir do zip v0.1.0. Esta é a release inaugural pública.

## Próximos passos previsíveis
- Testar v0.1.0 e iterar bugs reportados
- Polimento de ícones de providers (apple_music_artwork-style)
- Suporte a queues/upcoming
- Otimizar listas longas (virtual scrolling se necessário)
- Botão "favoritar" no mini-player

## Como continuar a conversa
Diz-me o problema/feature seguinte. Se precisares ver o código atual, anexa o zip que tens, ou pede-me para mostrar partes específicas.
