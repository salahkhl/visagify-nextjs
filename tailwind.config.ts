import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "bright-lavender": {
          "50": "#f0edf8",
          "100": "#e1dbf0",
          "200": "#c2b6e2",
          "300": "#a492d3",
          "400": "#866dc5",
          "500": "#6849b6",
          "600": "#533a92",
          "700": "#3e2c6d",
          "800": "#291d49",
          "900": "#150f24",
          "950": "#0f0a1a"
        },
      },
      fontFamily: {
        'sans': ['"Bodoni Moda"', 'serif'], // Police par défaut pour tous les textes
        'stack-sans-notch': ['"Stack Sans Notch"', 'sans-serif'],
        'bodoni-moda': ['"Bodoni Moda"', 'serif'],
        'inter': ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
