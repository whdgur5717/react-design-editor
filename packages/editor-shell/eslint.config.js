import baseConfig from "@design-editor/eslint-config"
import react from "eslint-plugin-react"

export default [
	...baseConfig,
	react.configs.flat.recommended,
	react.configs.flat["jsx-runtime"],
	{
		settings: {
			react: { version: "detect" },
		},
		rules: {
			"react/no-multi-comp": "warn",
		},
	},
]
