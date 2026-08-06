/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'panda-red': '#FFCD54',
        'panda-red-light': '#FFCD54',
        'panda-red-dark': '#FFCD54',
        'panda-green': '#00A799',
        'panda-dark': '#142035',
        'panda-gray': '#5a5a5a',
        'panda-surface': '#f8fafc',
        'section-light': '#ffffff',
        'section-alt': '#f1f5f9',
      },
      fontFamily: {
        unbounded: ['Sora', 'system-ui', 'sans-serif'],
        poppins: ['Sora', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
