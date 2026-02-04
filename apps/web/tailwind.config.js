const path = require('path')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.join(__dirname, 'app/**/*.{js,ts,jsx,tsx,mdx}'),
    path.join(__dirname, 'components/**/*.{js,ts,jsx,tsx,mdx}'),
    path.join(__dirname, 'pages/**/*.{js,ts,jsx,tsx,mdx}'),
  ],
  theme: {
    extend: {
      colors: {
        // Palette A — Blood & Bronze (design-guidelines)
        coliseum: {
          black: '#121212',
          stone: '#1E1B18',
          red: '#8E1C1C',
          bronze: '#C18F59',
          sand: '#D2B48C',
        },
      },
      fontFamily: {
        display: ['var(--font-vt323)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
