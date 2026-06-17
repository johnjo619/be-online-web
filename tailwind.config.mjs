/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'panda-red': '#f2cc5e',
        'panda-red-light': '#f2cc5e',
        'panda-red-dark': '#f2cc5e',
        'panda-green': '#04AA6D',
        'panda-dark': '#0f172a',
        'panda-gray': '#5a5a5a',
        'panda-surface': '#f8fafc',
        'section-light': '#ffffff',
        'section-alt': '#f1f5f9',
      },
      fontFamily: {
        unbounded: ['Unbounded', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
