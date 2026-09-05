/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ledger: {
          bg: '#F8F6F0',
          paper: '#FCFBF8',
          card: '#F3EFE5',
          border: '#DDD6C6',
          'border-dark': '#B8AE99',
          rule: '#EBE5D8',
          header: '#ECE5D5'
        },
        forest: {
          50: '#F1F6F3',
          100: '#E1EDE6',
          200: '#C4DBD0',
          600: '#2F664C',
          700: '#234F3A',
          800: '#1B3B2B',
          900: '#12261C'
        },
        leather: {
          50: '#FAF5F0',
          100: '#F4EAE1',
          200: '#E7D2C0',
          500: '#A76D42',
          600: '#8C5A35',
          700: '#6F4426',
          800: '#53331C'
        },
        ink: {
          900: '#1C231F',
          800: '#2E3631',
          700: '#46504A',
          500: '#6C7771',
          400: '#949E98'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        'ledger-sm': '0 1px 2px 0 rgba(40, 30, 20, 0.05)',
        'ledger': '0 2px 4px 0 rgba(40, 30, 20, 0.06), 0 1px 2px 0 rgba(40, 30, 20, 0.04)',
        'book': 'inset 1px 0 0 rgba(0,0,0,0.06), inset -1px 0 0 rgba(0,0,0,0.06)'
      }
    },
  },
  plugins: [],
}
