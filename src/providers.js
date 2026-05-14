// Cores e ícones por provider domain do Music Assistant.
// Os domains correspondem aos identificadores em https://github.com/music-assistant/server/tree/main/music_assistant/providers

const ICON_MUSIC = 'M12 3v10.55A4 4 0 1 0 14 17V7h4V3z';
const ICON_RADIO = 'M3.5 7h17v12h-17zM3.5 7l8.5-3 8.5 3M7 14a3 3 0 1 0 6 0';
const ICON_APPLE = 'M16.4 13.7c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.5 1.3 0 1.8-.8 3.3-.8 1.5 0 2 .8 3.3.8 1.4 0 2.3-1.2 3.1-2.4.9-1.4 1.3-2.7 1.4-2.8-.1-.1-2.6-1-2.8-3.2zM14.4 6.7c.7-.8 1.1-1.9 1-3-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.9 1.1 0 2.2-.6 2.9-1.4z';
const ICON_SPOTIFY = 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 14.5c-.2.3-.6.4-.9.2-2.5-1.5-5.6-1.9-9.3-1-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 4-.9 7.5-.5 10.3 1.2.3.2.4.6.2.9zm1.2-2.7c-.3.4-.8.5-1.2.3-2.8-1.7-7.1-2.2-10.4-1.2-.5.1-1-.1-1.1-.6-.1-.5.1-1 .6-1.1 3.8-1.2 8.5-.6 11.7 1.4.4.2.5.7.4 1.2zm.1-2.8C14.3 9 8.7 8.8 5.4 9.8c-.6.2-1.2-.2-1.4-.7-.2-.6.2-1.2.7-1.4 3.8-1.1 10-1 14.1 1.5.5.3.7 1 .4 1.5-.3.5-1 .7-1.5.4z';
const ICON_TIDAL = 'M12.012 3.992 8.008 7.996 4.004 3.992 0 7.996 4.004 12 8.008 7.996 12.012 12 8.008 16.004l4.004 4.004 4.004-4.004L12.024 12l4.004-4.004 3.984 4.004L24 7.996l-4.004-4.004-4.004 4.004z';
const ICON_QOBUZ = 'M12 2 2 7v10l10 5 10-5V7zM4 8.4l8 4 8-4M4 14l8 4 8-4';
const ICON_DEEZER = 'M3 18h2v3H3zm0-5h2v4H3zm0-5h2v4H3zm5 5h2v8H8zm0-5h2v4H8zm0-5h2v4H8zm5 5h2v8h-2zm0-5h2v4h-2zm5 0h2v13h-2z';
const ICON_YT = 'M21.6 7.2a2.5 2.5 0 0 0-1.7-1.8C18.3 5 12 5 12 5s-6.3 0-7.9.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8c.2 1 .9 1.6 1.7 1.8 1.6.4 7.9.4 7.9.4s6.3 0 7.9-.4a2.5 2.5 0 0 0 1.7-1.8C22 15.2 22 12 22 12s0-3.2-.4-4.8zM10 15V9l5 3z';
const ICON_TUNEIN = 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z';
const ICON_SOUNDCLOUD = 'M2 14a1 1 0 1 1 2 0v3a1 1 0 1 1-2 0zm3-2a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0zm3-2a1 1 0 1 1 2 0v7a1 1 0 1 1-2 0zm3-2a1 1 0 1 1 2 0v9a1 1 0 1 1-2 0zm4 0c0-.6.4-1 1-1 3 0 5 2 5 5s-2 5-5 5h-1z';
const ICON_PLEX = 'M11 2 5 12l6 10h2l-6-10 6-10zm6 0-6 10 6 10h2l-6-10 6-10z';
const ICON_JELLYFIN = 'M12 2 4 18h16zm0 4 5 10h-3l-2-4-2 4H7z';
const ICON_LIBRARY = 'M4 4h2v16H4zm3 0h2v16H7zm4 0h6l3 16h-6z';
const ICON_FOLDER = 'M3 6h6l2 2h10v11H3z';

export const PROVIDERS = {
  apple_music: { name: 'Apple Music', icon: ICON_APPLE, gradient: ['#FA2D48', '#B026FF'] },
  spotify: { name: 'Spotify', icon: ICON_SPOTIFY, gradient: ['#1DB954', '#0F8C3F'] },
  tidal: { name: 'Tidal', icon: ICON_TIDAL, gradient: ['#000000', '#1F2937'] },
  qobuz: { name: 'Qobuz', icon: ICON_QOBUZ, gradient: ['#0070D9', '#003E7E'] },
  deezer: { name: 'Deezer', icon: ICON_DEEZER, gradient: ['#A238FF', '#5C1F9E'] },
  ytmusic: { name: 'YouTube Music', icon: ICON_YT, gradient: ['#FF0000', '#990000'] },
  youtube_music: { name: 'YouTube Music', icon: ICON_YT, gradient: ['#FF0000', '#990000'] },
  tunein: { name: 'TuneIn', icon: ICON_RADIO, gradient: ['#F08218', '#A55810'] },
  radiobrowser: { name: 'Radio Browser', icon: ICON_RADIO, gradient: ['#F08218', '#A55810'] },
  soundcloud: { name: 'SoundCloud', icon: ICON_SOUNDCLOUD, gradient: ['#FF7700', '#CC5500'] },
  plex: { name: 'Plex', icon: ICON_PLEX, gradient: ['#E5A00D', '#B07A00'] },
  jellyfin: { name: 'Jellyfin', icon: ICON_JELLYFIN, gradient: ['#7B3FE4', '#3F2880'] },
  subsonic: { name: 'Subsonic', icon: ICON_MUSIC, gradient: ['#C32127', '#7E1518'] },
  opensubsonic: { name: 'OpenSubsonic', icon: ICON_MUSIC, gradient: ['#C32127', '#7E1518'] },
  filesystem_local: { name: 'Local Files', icon: ICON_FOLDER, gradient: ['#5E5670', '#3A3445'] },
  filesystem_smb: { name: 'SMB Share', icon: ICON_FOLDER, gradient: ['#5E5670', '#3A3445'] },
  builtin: { name: 'Music Assistant', icon: ICON_MUSIC, gradient: ['#EA3572', '#7B3FE4'] },
  library: { name: 'Music Assistant', icon: ICON_LIBRARY, gradient: ['#EA3572', '#7B3FE4'] }
};

const SF_GRAD_FALLBACK = ['#EA3572', '#7B3FE4'];

export function providerInfo(domain) {
  if (!domain) return { name: 'Music', icon: ICON_MUSIC, gradient: SF_GRAD_FALLBACK };
  const norm = String(domain).toLowerCase().replace(/-/g, '_');
  return PROVIDERS[norm] || { name: titleCase(domain), icon: ICON_MUSIC, gradient: SF_GRAD_FALLBACK };
}

function titleCase(s) {
  return String(s).replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function providerSvg(domain, size = 28) {
  const { icon, gradient } = providerInfo(domain);
  const id = `g${Math.random().toString(36).slice(2, 8)}`;
  return `
    <svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${gradient[0]}"/>
          <stop offset="100%" stop-color="${gradient[1]}"/>
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#${id})"/>
      <path d="${icon}" fill="white" opacity="0.95" transform="scale(0.6) translate(8 8)"/>
    </svg>`;
}
