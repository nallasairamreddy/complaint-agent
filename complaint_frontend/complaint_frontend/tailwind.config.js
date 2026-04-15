/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          950: '#080B11',
          900: '#0D1117',
          800: '#151B25',
          700: '#1E2736',
          600: '#2A3547',
        },
        signal: {
          red:    '#FF3B3B',
          amber:  '#FF9500',
          yellow: '#FFD60A',
          green:  '#30D158',
          blue:   '#0A84FF',
          cyan:   '#32ADE6',
        },
      },
      animation: {
        'fade-up':   'fadeUp 0.4s ease forwards',
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
        'slide-in':  'slideIn 0.3s ease forwards',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%':      { opacity: 0.4, transform: 'scale(0.75)' },
        },
        slideIn: {
          '0%':   { opacity: 0, transform: 'translateX(-8px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
