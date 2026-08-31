/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* ---- Courtyard palette ----------------------------------------
           terracotta  -> clay      (warm sun-baked plaster, CTAs)
           deep green  -> forest    (foliage, headings, night sky)
           cream       -> cream     (linen, page background)
           warm wood   -> bark      (deck timber, borders, rules)
           charcoal    -> ink       (body text)
        ------------------------------------------------------------------ */
        clay: {
          50: '#fdf3ee',
          100: '#fae3d7',
          200: '#f4c5ae',
          300: '#eba27f',
          400: '#e07f52',
          500: '#c4622d', // primary terracotta
          600: '#a94e21',
          700: '#8a3c1c',
          800: '#6f321b',
          900: '#5a2a18',
        },
        forest: {
          50: '#f1f6f2',
          100: '#dce9e0',
          200: '#bad4c4',
          300: '#8cb79f',
          400: '#5c9478',
          500: '#3c7759',
          600: '#2b5d45',
          700: '#234a38',
          800: '#1f3d2b', // primary deep green
          900: '#16291f',
          950: '#0c1711',
        },
        cream: {
          50: '#fdfbf7',
          100: '#faf5ec', // page background
          200: '#f4ebdb',
          300: '#ecdfc7',
          400: '#e0cdb0',
        },
        bark: {
          100: '#f0e6dc',
          200: '#e2cfc0',
          300: '#c9ab90',
          400: '#a98263',
          500: '#8b5e3c', // warm wood
          600: '#6f4a2f',
          700: '#573a26',
          800: '#402b1d',
        },
        ink: {
          DEFAULT: '#241d17',
          soft: '#4a4038',
          muted: '#7d7066',
        },
        gold: {
          DEFAULT: '#c9a227',
          soft: '#e3c766',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['clamp(2.6rem, 7vw, 5.5rem)', { lineHeight: '0.98', letterSpacing: '-0.02em' }],
        h2: ['clamp(2rem, 4.5vw, 3.4rem)', { lineHeight: '1.05', letterSpacing: '-0.015em' }],
      },
      letterSpacing: {
        widest2: '0.22em',
      },
      /* 4.5 (18px) is used for the inline icon size across the whole app and is
         not on Tailwind's default scale — without it those classes are dropped
         silently and the SVGs render unsized. */
      spacing: {
        4.5: '1.125rem',
      },
      transitionDuration: {
        400: '400ms',
      },
      maxWidth: {
        shell: '84rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(36,29,23,.04), 0 12px 32px -12px rgba(36,29,23,.18)',
        lift: '0 24px 60px -24px rgba(31,61,43,.35)',
        inset: 'inset 0 1px 0 rgba(255,255,255,.5)',
      },
      keyframes: {
        kenburns: {
          '0%': { transform: 'scale(1.04) translate3d(0,0,0)' },
          '100%': { transform: 'scale(1.16) translate3d(-1.2%,-1.6%,0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(196,98,45,.45)' },
          '70%': { boxShadow: '0 0 0 12px rgba(196,98,45,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(196,98,45,0)' },
        },
      },
      animation: {
        kenburns: 'kenburns 14s ease-out forwards',
        fadeUp: 'fadeUp .7s cubic-bezier(.22,1,.36,1) both',
        marquee: 'marquee 38s linear infinite',
        pulseRing: 'pulseRing 2.4s ease-out infinite',
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.42'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
