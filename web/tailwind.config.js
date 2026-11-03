/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0B1526',
        'navy-light': '#152035',
        blue: {
          DEFAULT: '#2147D6',
          light: '#EAF0FF',
        },
        ink: '#101828',
        muted: '#5B6577',
        border: '#E3E6EB',
        surface: '#F5F6F8',
        card: '#FFFFFF',
        status: {
          'ready-text': '#0B6B3A',
          'ready-bg': '#E3F5EA',
          'processing-text': '#7A4B00',
          'processing-bg': '#FFF1D6',
          'failed-text': '#A31B1B',
          'failed-bg': '#FDE8E8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'page-title': ['24px', { fontWeight: '700' }],
        body: ['14px', '1.5'],
        answer: ['16px', '1.65'],
        label: ['12px', '1.4'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
