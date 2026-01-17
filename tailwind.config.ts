import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#f472b6',
          dark: '#db2777',
        }
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
