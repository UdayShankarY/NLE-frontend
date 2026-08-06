/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand tokens lifted directly from the existing :root variables in index.css
        brand: {
          purple: { DEFAULT: '#6B21A8', light: '#9333EA', dark: '#4C1D95' },
          pink: '#EC4899',
          gold: '#F59E0B',
          green: '#10B981',
          rose: '#F43F5E',
        },
        bg: 'var(--color-bg-canvas, #FAF5FF)',
        border: 'var(--color-border, #E5E7EB)',
        ink: { DEFAULT: 'var(--color-ink, #1F2937)', muted: 'var(--color-ink-muted, #6B7280)' },
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
      },
      borderRadius: {
        card: '16px',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 8px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)',
        'card-hover': '0 4px 24px rgba(107,33,168,.12), 0 8px 32px rgba(0,0,0,.08)',
        glass: '0 8px 32px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.6)',
        glow: '0 0 24px rgba(107,33,168,.3)',
      },
      backdropBlur: {
        xs: '4px',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse2: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        dotBounce: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-in-right': 'slideInRight 0.35s ease forwards',
        'scale-in': 'scaleIn 0.25s ease forwards',
        shimmer: 'shimmer 1.8s linear infinite',
        'pulse-slow': 'pulse2 2.5s ease-in-out infinite',
        'dot-bounce': 'dotBounce 1.2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
