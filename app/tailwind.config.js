/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "glass-white": "rgba(255,255,255,0.2)",
        "glass-dark": "rgba(255,255,255,0.05)",
      },
      backdropBlur: {
        xl: "30px",
      },
      blur: {
        "3xl": "60px",
      },
      animation: {
        float: "float 20s ease-in-out infinite",
        "float-slow": "floatSlow 25s ease-in-out infinite",
        "float-reverse": "floatReverse 22s ease-in-out infinite",
        "fade-in": "fadeIn .8s ease-out forwards",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(30px,-30px)" },
        },
        floatSlow: {
          "0%,100%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(-20px,20px)" },
        },
        floatReverse: {
          "0%,100%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(20px,-20px)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
