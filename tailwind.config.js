/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        yellow: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        }
      },
      animation: {
        shine: 'shine 2s linear infinite',
        'fade-in': 'fade-in 0.6s ease-out',
        'scale-in': 'scale-in 0.4s ease-out',
        'confetti': 'confetti 0.8s ease-out',
        'float': 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'bounce': 'bounce 1s infinite',
      },
      keyframes: {
        shine: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        'confetti': {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
          '100%': { transform: 'translateY(-100px) rotate(360deg)', opacity: 0 },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(2deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            opacity: 1,
            boxShadow: '0 0 20px rgba(255, 107, 53, 0.5)'
          },
          '50%': { 
            opacity: 0.9,
            boxShadow: '0 0 40px rgba(255, 107, 53, 0.8)'
          },
        },
        'bounce': {
          '0%, 100%': { 
            transform: 'translateY(0)' 
          },
          '50%': { 
            transform: 'translateY(-10px)' 
          },
        },
      },
      boxShadow: {
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        'fun': ['Comic Neue', 'cursive', 'sans-serif'],
      },
    },
  },
  plugins: [],
}