import { SoundFlowCard } from './card.js';
import { SoundFlowCardEditor } from './editor.js';

const VERSION = '1.0.1';

if (!customElements.get('soundflow-card')) {
  customElements.define('soundflow-card', SoundFlowCard);
}
if (!customElements.get('soundflow-card-editor')) {
  customElements.define('soundflow-card-editor', SoundFlowCardEditor);
}

window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === 'soundflow-card')) {
  window.customCards.push({
    type: 'soundflow-card',
    name: 'SoundFlow Card',
    description: 'Card elegante para controlar o Music Assistant',
    preview: true,
    documentationURL: 'https://github.com/soundflow-dev/soundflow-card'
  });
}

console.info(
  `%c SoundFlow Card %c v${VERSION} `,
  'color:white;background:linear-gradient(135deg,#EA3572,#7B3FE4);padding:2px 6px;border-radius:4px 0 0 4px;font-weight:600;',
  'color:#7B3FE4;background:#1a1320;padding:2px 6px;border-radius:0 4px 4px 0;'
);
