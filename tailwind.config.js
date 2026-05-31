/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'check-pop': {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.18)' },
          '70%':  { transform: 'scale(0.92)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-in': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-out': {
          '0%':   { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'check-pop': 'check-pop 0.35s ease',
        'slide-in':  'slide-in 0.3s ease',
        'fade-out':  'fade-out 0.4s ease forwards',
      },
    },
  },
  plugins: [],
}
