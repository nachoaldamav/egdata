import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

export default {
  darkMode: ['class'],
  content: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'providers/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        'bronze-start': 'rgb(202, 81, 43)',
        'bronze-end': 'rgb(202, 81, 43, 0.6)',
        'silver-start': 'rgb(175, 180, 189)',
        'silver-end': 'rgb(175, 180, 189, 0.6)',
        'gold-start': 'rgb(255, 232, 60)',
        'gold-end': 'rgb(255, 232, 60, 0.6)',
        'platinum-start': 'rgb(114, 91, 255)',
        'platinum-end': 'rgb(114, 91, 255, 0.6)',
        badge: 'hsl(var(--badge))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        tilt: {
          '0%, 50%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1.5deg)' },
          '75%': { transform: 'rotate(-1.5deg)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        tilt: 'tilt 3s linear infinite',
        marquee: 'marquee 10s linear infinite',
      },
      perspective: {
        '1000': '1000px',
      },
      rotate: {
        'y-180': 'rotateY(180deg)',
        '15': '15deg',
        '30': '30deg',
        '45': '45deg',
        '60': '60deg',
        '90': '90deg',
        '120': '120deg',
        '135': '135deg',
        '180': '180deg',
      },
      backfaceVisibility: ['hidden'],
      boxShadow: {
        'glow-bronze': '0 0 12px rgba(202, 81, 43, 0.75)',
        'glow-silver': '0 0 12px rgba(175, 180, 189, 0.75)',
        'glow-gold': '0 0 12px rgba(255, 232, 60, 0.75)',
        'glow-platinum': '0 0 12px rgba(114, 91, 255, 0.75)',
      },
      transitionProperty: {
        bg: 'background-color, transform',
      },
      fontFamily: {
        sans: ['Nunito', ...fontFamily.sans],
        montserrat: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'bronze-radial':
          'radial-gradient(circle at bottom left, rgb(202, 81, 43), rgba(202, 81, 43, 0.6))',
        'silver-radial':
          'radial-gradient(circle at bottom left, rgb(175, 180, 189), rgba(175, 180, 189, 0.6))',
        'gold-radial':
          'radial-gradient(circle at bottom left, rgb(255, 232, 60), rgba(255, 232, 60, 0.6))',
        'platinum-radial':
          'radial-gradient(circle at bottom left, rgb(114, 91, 255), rgba(114, 91, 255, 0.6))',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@vidstack/react/tailwind.cjs')({
      prefix: '',
    }),
    require('@tailwindcss/typography'),
  ],
} satisfies Config;
