/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TheraGift wireframe renk paleti (koyu yeşil / krem / beyaz)
        brand: {
          dark: '#1F463F',
          DEFAULT: '#387A6B',
          light: '#336B60',
          soft: '#E8F3F0',
          mint: '#CFF3DF',
        },
        cream: '#EEF2F1',
        panel: '#F6F8F7',
        border: '#DDE3E1',
        ink: '#1A2226',
        muted: '#687178',
      },
    },
  },
  plugins: [],
}
