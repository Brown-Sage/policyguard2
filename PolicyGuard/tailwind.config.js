/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        surface: 'var(--surface)',
        primary: 'var(--primary)',
        text: 'var(--text)',
        muted: 'var(--muted)',
      }
    },
  },
  plugins: [],
}
