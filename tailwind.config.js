/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        fpt: {
          orange: '#F26522',
          orangeDark: '#D95214',
          blue: '#0050B3',
          blueDark: '#003A8C',
          grayBg: '#F8F9FA'
        }
      }
    },
  },
  plugins: [],
};
