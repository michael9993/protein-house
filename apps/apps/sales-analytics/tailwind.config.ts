import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    // Include Tremor components
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Extend with custom colors if needed
      colors: {
        // Use CSS variables from Macaw UI for consistency
        "tremor-brand": {
          faint: "rgb(var(--tremor-brand-faint) / <alpha-value>)",
          muted: "rgb(var(--tremor-brand-muted) / <alpha-value>)",
          subtle: "rgb(var(--tremor-brand-subtle) / <alpha-value>)",
          DEFAULT: "rgb(var(--tremor-brand) / <alpha-value>)",
          emphasis: "rgb(var(--tremor-brand-emphasis) / <alpha-value>)",
          inverted: "rgb(var(--tremor-brand-inverted) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
  // Tremor requires these dark mode classes
  darkMode: "class",
};

export default config;
