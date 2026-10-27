import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vanilla: {
          50: '#FAF8F4',
          100: '#F5F2E6',
          200: '#EEEBDA', // Core requested HEX
          300: '#E2DDC7',
          400: '#D4CBB0',
          500: '#BDB18F',
          600: '#918462',
          700: '#6C6044',
          800: '#483F2C',
          900: '#2A2419',
          950: '#19150E',
        },
        slate: {
          50: '#EEEBDA', // Canvas background mapped directly to #EEEBDA
          100: '#E7E2D0',
          200: '#DCD6C0', // Soft vanilla parchment borders
          300: '#CEC7AD',
          400: '#9B927E',
          500: '#776D5B',
          600: '#5C5343',
          700: '#463E31',
          800: '#322B22',
          900: '#231E17', // Rich warm espresso
          950: '#18140F',
        },
        indigo: {
          50: '#FAF7ED',
          100: '#F0EAD6',
          200: '#E4D9BA',
          300: '#CEBD8B',
          400: '#A89258',
          500: '#7E6637',
          600: '#2C241D', // Ultra-luxe dark roast accent
          700: '#201A14',
          800: '#17120E',
          900: '#251E17',
          950: '#130E0A',
        },
        brand: {
          50: '#FAF7ED',
          100: '#F0EAD6',
          200: '#EEEBDA',
          300: '#E2DDC7',
          400: '#CEBD8B',
          500: '#7E6637',
          600: '#2C241D',
          700: '#201A14',
          800: '#17120E',
          900: '#251E17',
          950: '#130E0A',
        },
      },
    },
  },
  plugins: [],
};

export default config;
