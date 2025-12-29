import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,tsx,jsx,jsx}',
    './src/components/**/*.{js,ts,tsx,jsx,jsx}',
    './src/app/**/*.{js,ts,tsx,jsx,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brown: {
          50: '#FBF9F5',
          100: '#F5F0E6',
          200: '#F0EBE3',
          300: '#D7C3A9',
          400: '#C4A385',
          500: '#A87C56',
          600: '#8C6A48',
          700: '#70553A',
          800: '#543F2A',
          900: '#2C1E12',
        },
        cream: '#fdf6ec',
        teal: {
          50: '#e6f7f8',
          100: '#c2e7ea',
          200: '#94d2d7',
          300: '#5cb0b9',
          400: '#2d8890',
          500: '#006d77',
          600: '#005a61',
          700: '#004a50',
          800: '#003a40',
          900: '#002a30',
        },
        accent: '#ff911d',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        chart: {
          '1': 'var(--chart-1)',
          '2': 'var(--chart-2)',
          '3': 'var(--chart-3)',
          '4': 'var(--chart-4)',
          '5': 'var(--chart-5)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};
export default config;