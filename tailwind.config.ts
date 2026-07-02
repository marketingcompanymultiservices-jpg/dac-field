import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        dac: {
          primary: "#004C6D",
          secondary: "#00B2D7",
          alert: "#D78C37",
          text: "#131413"
        }
      },
      boxShadow: {
        panel: "0 18px 55px rgba(0, 76, 109, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
