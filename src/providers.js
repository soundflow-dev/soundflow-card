// providers.js - Definições visuais e identificação de providers do Music Assistant

export const PROVIDER_DEFS = {
  apple_music: {
    name: 'Apple Music',
    gradient: 'linear-gradient(135deg, #FA243C 0%, #FB5C74 100%)',
    color: '#FA243C',
    icon: 'M9 18V5l12-2v13M6 21a3 3 0 100-6 3 3 0 000 6zM18 19a3 3 0 100-6 3 3 0 000 6z',
    iconStroke: false,
  },
  spotify: {
    name: 'Spotify',
    gradient: 'linear-gradient(135deg, #1DB954 0%, #1ED760 100%)',
    color: '#1DB954',
    icon: 'spotify',
    iconStroke: false,
  },
  tidal: {
    name: 'Tidal',
    gradient: 'linear-gradient(135deg, #000000 0%, #1A1A1A 100%)',
    color: '#000000',
    icon: 'tidal',
    iconStroke: false,
  },
  qobuz: {
    name: 'Qobuz',
    gradient: 'linear-gradient(135deg, #0070D8 0%, #00A0E9 100%)',
    color: '#0070D8',
    icon: 'qobuz',
    iconStroke: false,
  },
  deezer: {
    name: 'Deezer',
    gradient: 'linear-gradient(135deg, #6F42C1 0%, #9B59E0 100%)',
    color: '#6F42C1',
    icon: 'deezer',
    iconStroke: false,
  },
  ytmusic: {
    name: 'YouTube Music',
    gradient: 'linear-gradient(135deg, #FF0000 0%, #FF4444 100%)',
    color: '#FF0000',
    icon: 'ytmusic',
    iconStroke: false,
  },
  youtube_music: {
    name: 'YouTube Music',
    gradient: 'linear-gradient(135deg, #FF0000 0%, #FF4444 100%)',
    color: '#FF0000',
    icon: 'ytmusic',
    iconStroke: false,
  },
  tunein: {
    name: 'TuneIn',
    gradient: 'linear-gradient(135deg, #FFB800 0%, #FF8800 100%)',
    color: '#FFB800',
    icon: 'radio',
    iconStroke: true,
  },
  radiobrowser: {
    name: 'Radio Browser',
    gradient: 'linear-gradient(135deg, #FFB800 0%, #FF8800 100%)',
    color: '#FFB800',
    icon: 'radio',
    iconStroke: true,
  },
  soundcloud: {
    name: 'SoundCloud',
    gradient: 'linear-gradient(135deg, #FF7700 0%, #FF5500 100%)',
    color: '#FF7700',
    icon: 'soundcloud',
    iconStroke: false,
  },
  plex: {
    name: 'Plex',
    gradient: 'linear-gradient(135deg, #E5A00D 0%, #FFC125 100%)',
    color: '#E5A00D',
    icon: 'plex',
    iconStroke: false,
  },
  jellyfin: {
    name: 'Jellyfin',
    gradient: 'linear-gradient(135deg, #AA5CC3 0%, #00A4DC 100%)',
    color: '#AA5CC3',
    icon: 'jellyfin',
    iconStroke: false,
  },
  subsonic: {
    name: 'Subsonic',
    gradient: 'linear-gradient(135deg, #C71D23 0%, #E63946 100%)',
    color: '#C71D23',
    icon: 'subsonic',
    iconStroke: false,
  },
  filesystem_smb: {
    name: 'SMB Share',
    gradient: 'linear-gradient(135deg, #4A5568 0%, #718096 100%)',
    color: '#4A5568',
    icon: 'folder',
    iconStroke: true,
  },
  filesystem_local: {
    name: 'Local Files',
    gradient: 'linear-gradient(135deg, #4A5568 0%, #718096 100%)',
    color: '#4A5568',
    icon: 'folder',
    iconStroke: true,
  },
  builtin: {
    name: 'Music Assistant',
    gradient: 'linear-gradient(135deg, #EA3572 0%, #C729C7 50%, #7B3FE4 100%)',
    color: '#C729C7',
    icon: 'music',
    iconStroke: false,
  },
};

const DEFAULT_PROVIDER = {
  name: 'Provider',
  gradient: 'linear-gradient(135deg, #555 0%, #777 100%)',
  color: '#777',
  icon: 'music',
  iconStroke: false,
};

export function getProviderDef(domain) {
  if (!domain) return DEFAULT_PROVIDER;
  const key = String(domain).toLowerCase();
  return PROVIDER_DEFS[key] || DEFAULT_PROVIDER;
}

// SVG icons for providers (simplified branding)
export const PROVIDER_SVGS = {
  spotify: '<circle cx="12" cy="12" r="10" fill="white"/><path d="M7 14.5c3-1 6-1 9 .5M7 12c3.5-1 7-1 10.5.5M7 9.5c4-1.2 8.5-1 12 1" stroke="#1DB954" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  tidal: '<path d="M12 4l4 4-4 4-4-4 4-4zM4 8l4 4-4 4 4-4-4-4zM20 8l-4 4 4 4-4-4 4-4zM12 12l4 4-4 4-4-4 4-4z" fill="white"/>',
  qobuz: '<circle cx="12" cy="12" r="9" fill="none" stroke="white" stroke-width="2"/><circle cx="16" cy="16" r="2" fill="white"/>',
  deezer: '<rect x="3" y="14" width="3" height="6" fill="white"/><rect x="7" y="11" width="3" height="9" fill="white"/><rect x="11" y="8" width="3" height="12" fill="white"/><rect x="15" y="5" width="3" height="15" fill="white"/><rect x="19" y="2" width="3" height="18" fill="white"/>',
  ytmusic: '<circle cx="12" cy="12" r="10" fill="white"/><path d="M10 8.5v7l6-3.5z" fill="#FF0000"/>',
  radio: '<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49M19.07 4.93a10 10 0 010 14.14M7.76 16.24a6 6 0 010-8.49M4.93 19.07a10 10 0 010-14.14"/>',
  soundcloud: '<path d="M2 14h2v6H2zM5 12h2v8H5zM8 10h2v10H8zM11 14c0-3 2-5 5-5s5 2 5 5-2 5-5 5h-5z" fill="white"/>',
  plex: '<path d="M8 2l8 10-8 10z" fill="white"/>',
  jellyfin: '<path d="M12 4L4 18h16L12 4z" fill="white" opacity="0.9"/><path d="M12 9l-4 7h8l-4-7z" fill="white"/>',
  subsonic: '<circle cx="12" cy="12" r="10" fill="none" stroke="white" stroke-width="2"/><path d="M12 6v12M8 9v6M16 9v6" stroke="white" stroke-width="2" stroke-linecap="round"/>',
  folder: '<path d="M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
};

export function getProviderSvgPath(iconName) {
  return PROVIDER_SVGS[iconName] || PROVIDER_SVGS.music;
}
