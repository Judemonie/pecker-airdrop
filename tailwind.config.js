/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        pecker: {
          bg: '#0a0a0f',
          card: '#13131f',
          border: '#1e1e30',
          gold: '#f5c842',
          orange: '#ff6b35',
          green: '#00e676',
          red: '#ff1744',
          text: '#e8e8f0',
          muted: '#6b6b8a',
        }
      },
      fontFamily: {
        display: ['Space Mono', 'monospace'],
        body: ['DM Sans', 'sans-serif'],
      },
      animation: {
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(245,200,66,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(245,200,66,0.7)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'slide-up': {
          'from': { transform: 'translateY(20px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'glow': {
          '0%, 100%': { textShadow: '0 0 10px rgba(245,200,66,0.5)' },
          '50%': { textShadow: '0 0 30px rgba(245,200,66,1)' },
        }
      }
    },
  },
  plugins: [],
}
