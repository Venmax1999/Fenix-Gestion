/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#4dbfd4',
          500: '#1a8fa6',
          600: '#0d7a8a',
        },
        surface: {
          400: '#6ab3c0',
          500: '#4a8f9e',
        },
      },
    },
  },
  plugins: [],
};
