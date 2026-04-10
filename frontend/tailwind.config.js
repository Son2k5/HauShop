/** @type {import('tailwindcss').Config} */
import tailwindScrollbar from 'tailwind-scrollbar';
import tailwindForms from '@tailwindcss/forms';
import tailwindTypography from '@tailwindcss/typography';
import tailwindAspectRatio from '@tailwindcss/aspect-ratio';

export default {
  darkMode: 'class',

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],

  theme: {
    extend: {
      maxWidth: {
        container: "1440px",
      },

      screens: {
        xs: "375px",
        sm: "425px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },

      fontFamily: {
        bodyFont: ["DM Sans", "sans-serif"],
        titleFont: ["Poppins", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },

      colors: {
        primeColor: "#262626",
        lightText: "#6D6D6D",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",
        background: {
          DEFAULT: "#ffffff",
          dark: "#0f172a",
        },
        text: {
          DEFAULT: "#111827",
          dark: "#e5e7eb",
        },
      },

      boxShadow: {
        testShadow: "0px 0px 54px -13px rgba(0,0,0,0.7)",
        card: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
        cardHover: "0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)",
        dropdown: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
        modal: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
        toast: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
      },
      zIndex: {
        '-1': '-1',
        0: '0',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
        auto: 'auto',
        dropdown: '1000',
        sticky: '1020',
        fixed: '1030',
        modalBackdrop: '1040',
        modal: '1050',
        popover: '1060',
        tooltip: '1070',
        toast: '1080',
      },

      animation: {
        'fade-in': 'fadeIn 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-out': 'fadeOut 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slideDown 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-left': 'slideLeft 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-right': 'slideRight 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-out': 'scaleOut 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'shimmer': 'shimmer 1.5s linear infinite',
        'shimmer-fast': 'shimmer 0.8s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'page-enter': 'slideUp 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        'page-exit': 'fadeOut 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'toast-in': 'slideUp 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'toast-out': 'fadeOut 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'marquee': 'marquee 20s linear infinite',
        'marquee-reverse': 'marqueeReverse 20s linear infinite',
        'marquee-fast': 'marquee 10s linear infinite',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
          '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        marqueeReverse: {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        skeleton: {
          '0%': { backgroundColor: '#f3f4f6' },
          '50%': { backgroundColor: '#e5e7eb' },
          '100%': { backgroundColor: '#f3f4f6' },
        },
      },

      transitionDelay: {
        100: '100ms',
        200: '200ms',
        300: '300ms',
        400: '400ms',
        500: '500ms',
      },

      transitionProperty: {
        height: 'height',
        spacing: 'margin, padding',
        'transform-opacity': 'transform, opacity',
      },
    },
  },

  plugins: [
    tailwindScrollbar,
    tailwindForms,
    tailwindTypography,
    tailwindAspectRatio
  ],

  safelist: [
    {
      pattern: /animate-(fade|slide|scale|pulse|float|bounce|spin|marquee|skeleton)/,
    },
    {
      pattern: /bg-(red|blue|green|yellow|gray)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /text-(red|blue|green|yellow|gray)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    'hover:scale-105',
    'hover:scale-110',
    'hover:-translate-y-1',
    'active:scale-95',
    'dark:bg-background-dark',
    'dark:text-text-dark',
  ],
}