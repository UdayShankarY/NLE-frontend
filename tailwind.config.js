/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand tokens lifted directly from the existing :root variables in index.css
        brand: {
          purple: { DEFAULT: '#6B21A8', light: '#9333EA', dark: '#4C1D95' },
          pink: '#EC4899',
          gold: '#F59E0B',
          green: '#10B981',
        },
        bg: '#FAF5FF',
        border: '#E5E7EB',
        ink: { DEFAULT: '#1F2937', muted: '#6B7280' },
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // 8px spacing scale as extra steps beyond Tailwind's default (which is already 4px-based,
      // so every default token is already on-grid; these just add named aliases used across the app)
      spacing: {
        18: '4.5rem',
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,.08)',
      },
    },
  },
  plugins: [],
}
