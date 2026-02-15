import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

export default tseslint.config(
	// Global ignores (replaces ignorePatterns)
	{
		ignores: [
			"*.js",
			"*.jsx",
			"*.cjs",
			"*.mjs",
			"src/checkout/src/graphql/**",
			".next/**",
			"out/**",
			"build/**",
			"next-env.d.ts",
		],
	},

	// Base JS recommended rules
	js.configs.recommended,

	// Next.js core-web-vitals via FlatCompat
	// Brings: React, React Hooks, a11y, import, Next.js plugin, @typescript-eslint/recommended
	...compat.extends("next/core-web-vitals"),

	// Type-checked TS rules (adds type checking on top of recommended from next/core-web-vitals)
	...tseslint.configs.recommendedTypeCheckedOnly,

	// Parser options for type-aware linting
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: __dirname,
			},
		},
	},

	// Custom TypeScript and import rules
	{
		rules: {
			// Import ordering and hygiene
			"import/order": "error",
			"import/no-mutable-exports": "error",
			"import/no-cycle": "error",
			"import/no-default-export": "error",
			"import/no-unresolved": "off",
			"import/no-duplicates": ["error", { "prefer-inline": true }],
			"import/namespace": "off",

			// Disable base no-unused-vars in favor of @typescript-eslint/no-unused-vars
			"no-unused-vars": "off",

			// TypeScript
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{
					prefer: "type-imports",
					fixStyle: "inline-type-imports",
					disallowTypeAnnotations: false,
				},
			],
			"no-empty-pattern": "off",
			"@typescript-eslint/no-empty-object-type": "off",
			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/require-await": "off",
			"@typescript-eslint/return-await": ["error", "in-try-catch"],
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			],
			"@typescript-eslint/restrict-template-expressions": [
				"error",
				{ allowNumber: true, allowBoolean: true },
			],
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-return": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-misused-promises": [
				"error",
				{ checksVoidReturn: false },
			],
		},
	},

	// Allow default exports in Next.js page/layout files and .ts files
	{
		files: [
			"src/app/**/{page,layout,error,loading,not-found}.tsx",
			"**/*.ts",
		],
		rules: {
			"import/no-default-export": "off",
		},
	},

	// Checkout: restrict Next.js imports (checkout is a standalone component)
	{
		files: ["src/checkout/**/*.{ts,tsx}"],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						{
							group: ["next/*", "@next/*", "next"],
							message:
								"Usage of Next.js-specific imports inside src/checkout is forbidden. Checkout is a standalone component and should not depend on Next.js.",
						},
					],
				},
			],
		},
	},

	// Prettier must be last to override formatting rules
	prettierConfig,
);
