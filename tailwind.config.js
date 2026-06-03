/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#00D4FF',
          DEFAULT: '#00B4D8',
          dark: '#0077B6',
        },
        accent: {
          purple: '#9B59B6',
          gold: '#FFD700',
          green: '#00FF88',
          orange: '#FF6B35',
          magenta: '#FF00FF',
        },
        dark: {
          DEFAULT: '#0a0a1a',
          lighter: '#12122a',
          card: 'rgba(18, 18, 42, 0.7)',
        },
      },
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'monospace'],
        sans: ['"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.8)' },
        },
      },
    },
  },
  plugins: [],
};
