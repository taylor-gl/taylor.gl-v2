import plugin from 'tailwindcss/plugin';

export default plugin(
  ({ addVariant }) => {
    addVariant('glow', '.glow-overlay &');
  },
  {
    theme: {
      extend: {
        colors: {
          glow: 'color-mix(in srgb, var(--glow-color) calc(<alpha-value> * 100%), transparent)',
        },
      },
    },
  }
);
