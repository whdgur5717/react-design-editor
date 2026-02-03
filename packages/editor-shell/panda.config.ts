import { defineConfig } from "@pandacss/dev"
import { preset } from "panda-animation"
import { defaultPreset } from "@design-editor/theme/preset"

export default defineConfig({
	preflight: true,
	importMap: "@design-editor/theme",
	include: ["./src/**/*.{js,jsx,ts,tsx}", "../ui/src/**/*.{js,jsx,ts,tsx}"],
	exclude: [],
	presets: [preset(), "@pandacss/preset-panda", defaultPreset],
	jsxFramework: "react",
	outdir: "styled-system",
})
