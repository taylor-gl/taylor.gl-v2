import typography from '@tailwindcss/typography';
import glow from './glow.js';

export default {
  content: ['./src/**/*'],
  darkMode: 'class',
  plugins: [glow, typography],
};
