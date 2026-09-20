import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e8ecf9',
          100: '#c5cdf0',
          500: '#1833b2',
          600: '#0f24a0',
          700: '#001c82',
          900: '#000e4a',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f4f6fb',
          border: '#e2e6f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
