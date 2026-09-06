import baseConfig from "@open-editor-sdk/eslint-config"
import react from "eslint-plugin-react"

const codeFiles = ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"]

export default [
	...baseConfig,
	{
		...react.configs.flat.recommended,
		files: codeFiles,
	},
	{
		...react.configs.flat["jsx-runtime"],
		files: codeFiles,
	},
	{
		files: codeFiles,
		settings: {
			react: { version: "detect" },
		},
	},
]
