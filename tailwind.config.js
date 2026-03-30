/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        bengali: ['"Hind Siliguri"', 'sans-serif'],
        mono: ['"Geist Mono"', '"Fira Code"', 'monospace'],
      },
      colors: {
        lekho: {
          base: '#08080f',
          surface: '#0f0f1a',
          elevated: '#16162a',
          border: 'rgba(255,255,255,0.07)',
          primary: '#7c5af0',
          'primary-light': '#9b7ef8',
          'primary-dark': '#5a3fd4',
          accent: '#00d4ff',
          'accent-dark': '#00a8cc',
          text: '#e8e8f5',
          muted: '#6b6b8a',
          'muted-light': '#9090aa',
          rose: '#f43f5e',
          // Legacy colors kept for compatibility
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          700: '#1d4ed8',
          900: '#1e3a8a',
        }
      },
      backgroundImage: {
        'gradient-lekho': 'linear-gradient(135deg, #7c5af0, #00d4ff)',
        'gradient-lekho-v': 'linear-gradient(180deg, #7c5af0, #00d4ff)',
        'gradient-lekho-soft': 'linear-gradient(135deg, rgba(124,90,240,0.15), rgba(0,212,255,0.15))',
        'gradient-dark': 'linear-gradient(180deg, #0f0f1a, #08080f)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'gradient-shift': 'gradientShift 10s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'scale-in': 'scaleIn 0.2s ease-out',
        'badge-pop': 'badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(124,90,240,0.35)' },
          '50%': { boxShadow: '0 0 28px rgba(124,90,240,0.75)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        badgePop: {
          '0%': { transform: 'scale(0)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'glow-purple': '0 0 24px rgba(124,90,240,0.35)',
        'glow-purple-lg': '0 0 40px rgba(124,90,240,0.5)',
        'glow-cyan': '0 0 24px rgba(0,212,255,0.3)',
        'glow-rose': '0 0 16px rgba(244,63,94,0.45)',
        'card': '0 4px 32px rgba(0,0,0,0.45)',
        'card-hover': '0 12px 40px rgba(0,0,0,0.65)',
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
