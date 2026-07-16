/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0f7f2',
          100: '#dcebe0',
          200: '#bbd8c5',
          300: '#8fbda2',
          400: '#5f9c7b',
          500: '#3f7f5e',
          600: '#2d6a4f',
          700: '#24523e',
          800: '#1b4332',
          900: '#132e23',
          950: '#0a1a13',
        },
        earth: {
          50: '#faf8f4',
          100: '#f2ede3',
          200: '#e3d8c4',
          300: '#d0bd9d',
          400: '#bb9e75',
          500: '#a8875b',
          600: '#8f6e48',
          700: '#75583c',
          800: '#604835',
          900: '#503c2e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        'scale-in': 'scale-in 0.4s ease-out both',
      },
      boxShadow: {
        card: '0 1px 3px rgba(19, 46, 35, 0.06), 0 8px 24px rgba(19, 46, 35, 0.08)',
        'card-hover': '0 4px 8px rgba(19, 46, 35, 0.08), 0 16px 40px rgba(19, 46, 35, 0.14)',
      },
    },
  },
  plugins: [],
};
