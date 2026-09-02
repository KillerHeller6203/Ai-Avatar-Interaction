/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111927",
        paper: "#f6f5f4",
        cream: "#ffffff",
        accent: "#C8F135",
        "accent-dark": "#0f0f0f",
        muted: "#6b7280",
        border: "#e5e5e5",
      },
    },
  },
  plugins: [],
};
