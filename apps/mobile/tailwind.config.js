// Los colores salen de src/lib/theme.ts como variables CSS; aquí solo se nombran.
const color = (name) => `var(--${name})`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: Object.fromEntries(
        [
          'background',
          'card',
          'label',
          'secondary',
          'separator',
          'fill',
          'accent',
          'on-accent',
          'positive',
          'negative',
          'warning',
        ].map((name) => [name, color(name)]),
      ),
    },
  },
};
