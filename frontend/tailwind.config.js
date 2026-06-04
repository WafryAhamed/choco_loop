
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        card: 'var(--card)',
        primary: {
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-dark)',
        },
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        border: 'var(--border)',
        hover: 'var(--hover)',
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          text: 'var(--sidebar-text)',
          active: 'var(--sidebar-active)',
          hover: 'var(--sidebar-hover)',
        },
        status: {
          success: 'var(--success)',
          warning: 'var(--warning)',
          danger: 'var(--danger)',
          info: 'var(--info)',
          neutral: 'var(--neutral)',
        },
        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          grid: 'var(--chart-grid)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      boxShadow: {
        'premium': '0 4px 16px rgba(74, 44, 36, 0.08)',
        'premium-dark': '0 8px 24px rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
}
