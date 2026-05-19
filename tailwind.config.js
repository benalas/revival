/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['DM Serif Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        cream: { 50: '#fdfcf8', 100: '#f7f4ec', 200: '#ede7d4' },
        forest: { 400: '#5a8a6a', 500: '#3d6b50', 600: '#2d5040', 700: '#1e3829' },
        gold:   { 300: '#e8c97a', 400: '#d4a843', 500: '#b8891e' },
        rust:   { 400: '#c4614a', 500: '#a84832', 600: '#8c3520' },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'progress': 'progress 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:    { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        progress:  { '0%': { width: '0%' }, '50%': { width: '70%' }, '100%': { width: '100%' } },
      },
    },
  },
  plugins: [],
}
