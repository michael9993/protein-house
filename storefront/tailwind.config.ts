import TypographyPlugin from "@tailwindcss/typography";
import FormPlugin from "@tailwindcss/forms";
import ContainerQueriesPlugin from "@tailwindcss/container-queries";
import { type Config } from "tailwindcss";

const config: Config = {
	content: ["./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			// Colors from store config CSS variables
			colors: {
				store: {
					primary: "var(--store-primary)",
					secondary: "var(--store-secondary)",
					accent: "var(--store-accent)",
					bg: "var(--store-bg)",
					surface: "var(--store-surface)",
					text: "var(--store-text)",
					"text-muted": "var(--store-text-muted)",
					success: "var(--store-success)",
					warning: "var(--store-warning)",
					error: "var(--store-error)",
				},
			},
			// Typography from store config CSS variables
			fontFamily: {
				heading: "var(--store-font-heading)",
				body: "var(--store-font-body)",
				mono: "var(--store-font-mono)",
			},
			// Border radius from store config CSS variables
			borderRadius: {
				store: "var(--store-radius)",
			},
		},
	},
	plugins: [TypographyPlugin, FormPlugin, ContainerQueriesPlugin],
};

export default config;
