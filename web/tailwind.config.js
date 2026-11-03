/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ─── Color tokens ───────────────────────────────────────────────
      // Source of truth: fe-brief.md hex values
      // Surface hierarchy: MD3 naming from HTML (useful for depth layering)
      // Where they conflict, brief wins.
      colors: {
        // Page & sidebar shell
        navy: '#0B1526',
        'navy-mid': '#111C30',
        'navy-border': '#1E293B',
        'navy-hover': '#152238',

        // Primary accent (brief: #2147D6, HTML: primary-container matches)
        'primary-container': '#2147D6',
        'on-primary': '#FFFFFF',
        'primary-fixed': '#DDE1FF',
        'primary-fixed-dim': '#B9C3FF',
        'primary': '#002FB1',            // darker, used for text links & icons on light bg

        // Surface / background hierarchy (brief bg=#F5F6F8, card=#FFFFFF)
        // MD3 names kept; values reconciled with brief
        'background': '#F5F6F8',         // brief: bg — page canvas
        'surface': '#FFFFFF',            // brief: card — white cards
        'surface-bright': '#FFFFFF',
        'surface-container-lowest': '#FFFFFF',   // pure white card interiors
        'surface-container-low': '#F0F3FF',      // input bg, code bg
        'surface-container': '#E7EEFF',          // pill bg, chip bg — brief blueLight ≈ #EAF0FF
        'surface-container-high': '#DEE8FE',     // tag bg, selected rows
        'surface-container-highest': '#D9E3F8',  // strongest tint

        // Text (brief: primary=#101828, muted=#5B6577)
        'on-surface': '#101828',          // brief value (HTML used #121c2b)
        'on-surface-variant': '#5B6577',  // brief value (HTML used #444655)
        'secondary': '#5B6577',           // alias — same as on-surface-variant
        'on-background': '#101828',

        // Borders & dividers (brief: #E3E6EB)
        'outline': '#747686',
        'outline-variant': '#E3E6EB',    // brief value — used for card borders

        // Secondary container (tags, pills)
        'secondary-container': '#D9E2FB',
        'on-secondary-container': '#5B6479',

        // Status: Ready (brief values)
        'ready-text': '#0B6B3A',
        'ready-bg': '#E3F5EA',
        'ready-border': '#C4EBD0',

        // Status: Processing / Warning (brief values)
        'processing-text': '#7A4B00',
        'processing-bg': '#FFF1D6',

        // Status: Failed / Error (brief values)
        'error': '#BA1A1A',
        'error-container': '#FDE8E8',    // brief value (HTML used #ffdad6)
        'on-error': '#FFFFFF',
        'on-error-container': '#A31B1B', // brief value (HTML used #93000a)

        // Misc
        'inverse-surface': '#273141',
        'tertiary-container': '#525864',
        'on-tertiary-fixed-variant': '#404753',
      },

      // ─── Typography ─────────────────────────────────────────────────
      // Exact scale from HTML — preserved as-is (browser-validated)
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'caption':       ['12px', { lineHeight: '16px', letterSpacing: '0.01em',  fontWeight: '500' }],
        'body-sm':       ['13px', { lineHeight: '18px', letterSpacing: '0em',     fontWeight: '400' }],
        'code-sm':       ['11px', { lineHeight: '16px', letterSpacing: '0em',     fontWeight: '500' }],
        'code-md':       ['13px', { lineHeight: '20px', letterSpacing: '-0.01em', fontWeight: '500' }],
        'body-md':       ['14px', { lineHeight: '20px', letterSpacing: '0em',     fontWeight: '400' }],
        'body-md-medium':['14px', { lineHeight: '20px', letterSpacing: '0em',     fontWeight: '500' }],
        'body-lg':       ['16px', { lineHeight: '24px', letterSpacing: '-0.005em',fontWeight: '400' }],
        'headline-sm':   ['16px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-md':   ['20px', { lineHeight: '28px', letterSpacing: '-0.015em',fontWeight: '600' }],
        'headline-lg':   ['24px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-xl':   ['32px', { lineHeight: '40px', letterSpacing: '-0.025em',fontWeight: '700' }],
      },

      // ─── Spacing ────────────────────────────────────────────────────
      // From HTML — named semantic spacing scale
      spacing: {
        'space-xs': '0.25rem',   //  4px
        'space-sm': '0.5rem',    //  8px
        'space-md': '1rem',      // 16px
        'space-lg': '1.5rem',    // 24px
        'space-xl': '2rem',      // 32px
        'sidebar':  '240px',
      },

      // ─── Border radius ──────────────────────────────────────────────
      borderRadius: {
        DEFAULT: '0.25rem',
        lg:      '0.5rem',
        xl:      '0.75rem',   // brief: 12px cards
        full:    '9999px',
      },

      // ─── Shadows ────────────────────────────────────────────────────
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
      },

      // ─── Z-index ────────────────────────────────────────────────────
      zIndex: {
        sidebar: '50',
        header:  '40',
        modal:   '60',
        tooltip: '70',
      },
    },
  },
  plugins: [],
}
