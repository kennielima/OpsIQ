/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:        '#0B1526',
        'navy-pill': '#17243A',
        'navy-line': '#1C2A41',
        bg:          '#F5F6F8',
        card:        '#FFFFFF',
        line:        '#E3E6EB',
        'line-soft': '#EDEFF2',
        ink:         '#101828',
        'ink-2':     '#5B6577',
        'ink-nav':   '#E7ECF3',
        'ink-nav-2': '#8A98AD',
        accent:      '#2147D6',
        'accent-h':  '#1B3BB5',
        tint:        '#EAF0FF',
        'tint-line': '#C9D7FB',
        'ok-bg':     '#E3F5EA',
        'ok-ink':    '#0B6B3A',
        'warn-bg':   '#FFF1D6',
        'warn-ink':  '#7A4B00',
        'fail-bg':   '#FDE8E8',
        'fail-ink':  '#A31B1B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'page-title':   ['24px', { fontWeight: '700', letterSpacing: '-0.02em', lineHeight: '1.3' }],
        'card-heading': ['16px', { fontWeight: '700', lineHeight: '1.4' }],
        answer:         ['16px', { fontWeight: '400', lineHeight: '1.65' }],
        body:           ['14px', { fontWeight: '400', lineHeight: '1.5' }],
        label:          ['12px', { fontWeight: '600', letterSpacing: '0.01em', lineHeight: '1.4' }],
        mono:           ['13px', { fontWeight: '400', lineHeight: '1.5' }],
        caption:        ['12.5px', { fontWeight: '400', lineHeight: '1.5' }],
      },
      borderRadius: {
        DEFAULT: '12px',
        sm:      '8px',
        xs:      '6px',
        full:    '9999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.04)',
        pop:  '0 8px 28px rgba(16,24,40,.16), 0 2px 6px rgba(16,24,40,.08)',
      },
      spacing: {
        sidebar:      '240px',
        control:      '44px',
        'control-sm': '36px',
      },
      maxWidth: {
        screen: '1120px',
      },
      zIndex: {
        modal: '50',
      },
    },
  },
  plugins: [],
}
