import js from "@eslint/js"
import markdown from "@eslint/markdown"
import tseslint from "typescript-eslint"
import tsParser from "@typescript-eslint/parser"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import eslintConfigPrettier from "eslint-config-prettier"

const codeFiles = ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"]

export default [
	{
		ignores: ["node_modules/**", "dist/**", "*.config.{js,ts,cjs}"],
	},
	...markdown.configs.recommended,
	{
		...js.configs.recommended,
		files: codeFiles,
	},
	...tseslint.configs.recommended.map((config) => ({
		...config,
		files: codeFiles,
	})),
	{
		files: codeFiles,
		plugins: {
			"simple-import-sort": simpleImportSort,
		},
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				projectService: true,
			},
		},
		rules: {
			"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
			"simple-import-sort/imports": "error",
			"simple-import-sort/exports": "error",
		},
	},
	eslintConfigPrettier,
]
