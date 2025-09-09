/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1d4ed8', // 亮蓝色，与 index.css 保持一致
      },
      borderRadius: {
        button: '12px', // 与 index.css 保持一致
      },
    },
  },
  plugins: [],
};