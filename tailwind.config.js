/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './App.tsx',
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#4f46e5',
        'brand-secondary': '#10b981',
      },
      fontFamily: {
        logo: ['Orbitron', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
