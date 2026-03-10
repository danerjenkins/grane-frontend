/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-serif', 'Georgia', 'serif'],
        admin: ['var(--font-admin)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: 'hsl(var(--brand) / <alpha-value>)',
        'brand-soft': 'hsl(var(--brand-soft) / <alpha-value>)',
        'brand-strong': 'hsl(var(--brand-strong) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        text: 'hsl(var(--text) / <alpha-value>)',
        secondary: 'hsl(var(--text-secondary) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        'accent-soft': 'hsl(var(--accent-soft) / <alpha-value>)',
        success: 'hsl(var(--success) / <alpha-value>)',
        'success-soft': 'hsl(var(--success-soft) / <alpha-value>)',
        danger: 'hsl(var(--danger) / <alpha-value>)',
        'danger-soft': 'hsl(var(--danger-soft) / <alpha-value>)',
        warning: 'hsl(var(--warning) / <alpha-value>)',
        'warning-soft': 'hsl(var(--warning-soft) / <alpha-value>)',
        info: 'hsl(var(--info) / <alpha-value>)',
        'info-soft': 'hsl(var(--info-soft) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
