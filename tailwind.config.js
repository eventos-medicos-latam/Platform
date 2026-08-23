export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand)',
          deep: 'var(--brand-deep)',
          support: 'var(--brand-support)',
          soft: 'var(--brand-soft)',
        },
        canvas: 'var(--canvas)',
        line: 'var(--line)',
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
        },
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        hb: {
          ink: 'var(--hb-ink)',
          violet: 'var(--hb-violet)',
          deep: 'var(--hb-violet-deep)',
          soft: 'var(--hb-violet-soft)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        emphasis: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      maxWidth: {
        shell: '1240px',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(15, 45, 82, 0.04), 0 12px 32px -18px rgba(15, 45, 82, 0.28)',
        lift: '0 18px 44px -22px rgba(15, 45, 82, 0.4)',
        elev1: 'var(--elev-1)',
        elev2: 'var(--elev-2)',
        elev3: 'var(--elev-3)',
        elev4: 'var(--elev-4)',
      },
    },
  },
  plugins: [],
};
