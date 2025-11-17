/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Lato", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans", "Helvetica Neue", "Arial", "sans-serif"],
      },
      colors: {
        primary: {
          blue: '#003A6D',
          green: '#B2D235',
          'blue-tint': '#2C5A8B',
          'blue-shade': '#002650',
          'green-tint': '#C9DF60',
          'green-shade': '#8FA823',
        },
        accent: {
          coral: '#FF6A4D',
          purple: '#6F3DD8',
          aqua: '#3DCFD1',
          midnight: '#30343C',
        },
        neutral: {
          canvas: '#F7F9FB',
          card: '#E8EDF2',
          'dark-1': '#111111',
          'dark-2': '#6B7280',
        },
      },
      boxShadow: {
        soft: '0 10px 25px -10px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        xl2: '1rem',
      },
      keyframes: {
        floatUp: {
          '0%': {
            transform: 'translateY(6px)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1'
          },
        },
      },
      animation: {
        floatUp: 'floatUp 400ms ease-out both',
      },
    },
  },
  plugins: [],
}
