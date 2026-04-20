import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sidebar
        sidebar: {
          DEFAULT: '#0A1628',
          border: '#1a2740',
          text: '#94a3b8',
          'text-active': '#f1f5f9',
          hover: '#141f35',
          active: '#1e3a5f',
        },
        // Brand
        brand: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          light: '#3b82f6',
          muted: '#eff6ff',
        },
        // Status colors
        status: {
          open: '#059669',
          'open-bg': '#ecfdf5',
          'open-border': '#a7f3d0',
          sold: '#dc2626',
          'sold-bg': '#fef2f2',
          'sold-border': '#fecaca',
          expected: '#d97706',
          'expected-bg': '#fffbeb',
          'expected-border': '#fde68a',
          monitoring: '#2563eb',
          'monitoring-bg': '#eff6ff',
          'monitoring-border': '#bfdbfe',
          unknown: '#6b7280',
          'unknown-bg': '#f9fafb',
          'unknown-border': '#e5e7eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        modal: '0 20px 60px -12px rgb(0 0 0 / 0.25)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
