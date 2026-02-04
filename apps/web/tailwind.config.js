/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
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
