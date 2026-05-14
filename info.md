# SoundFlow Card

Elegant Lovelace card for Music Assistant.

- 🌍 Auto language (PT/EN)
- 🌗 Auto light/dark theme
- 🎶 Providers + favorites + radios
- 🗂️ Library tracks by provider (e.g. Apple Music — Bruno / Maria separately)
- 🔀 Shuffle-all on playlists / "All tracks"
- 🔊 Multi-speaker sync with dynamic leader and auto-group
- 🎯 Queue transfers automatically when the leader is removed
- 🎚️ Equalize volume

## Requirements

- **Music Assistant Queue Actions** (`mass_queue`) — install via HACS Custom Repository: <https://github.com/droans/mass_queue>. Required for per-provider track filtering and richer player info.

## Sonos speakers

If you control Sonos through Music Assistant, change the output protocol to **MP3** in *MA → Settings → Players → your Sonos → Output protocol*. The default chunked output causes `ERROR_BUFFERING` and stalls grouped playback. Also make sure the **Sonos provider** is active in MA (otherwise it falls back to AirPlay).

```yaml
type: custom:soundflow-card
```
