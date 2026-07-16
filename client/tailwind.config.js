/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#004ac6",
        "primary-container": "#2563eb",
        "on-primary-container": "#eeefff",
        background: "#f7f9fb",
        surface: "#ffffff",
        outline: "#737686",
        "on-surface": "#191c1e",
        "on-surface-variant": "#434655",
        error: "#ba1a1a",
        "primary-fixed": "#dbe1ff"
      },
      fontFamily: {
        heading: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
}
