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
	{
		files: ["src/components/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}"],
		rules: {
			"no-restricted-syntax": [
				"error",
				{
					selector: "MemberExpression[object.name='editor'][property.name='store']",
					message: "Do not access editor.store from UI; add an Editor method or Usecase.",
				},
				{
					selector: "MemberExpression[object.name='editor'][property.name='receiver']",
					message: "Do not access editor.receiver from UI; add an Editor method or Usecase.",
				},
				{
					selector: "MemberExpression[object.name='editor'][property.name='commandHistory']",
					message: "Do not access editor.commandHistory from UI; use Editor history methods.",
				},
				{
					selector: "CallExpression[callee.object.name='editor'][callee.property.name='getReceiver']",
					message: "Do not call editor.getReceiver() from UI; add an Editor method or Usecase.",
				},
			],
		},
	},
]
