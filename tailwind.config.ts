import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e8ecfb',
          500: '#1833b2',
          700: '#001c82',
        },
        navy: {
          700: '#1c2540',
          800: '#141b2e',
          900: '#0c1120',
        },
      },
    },
  },
  plugins: [],
}

export default config
