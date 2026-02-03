import { defineConfig } from "@pandacss/dev"

export default defineConfig({
	importMap: "@design-editor/theme",
	include: ["./src/**/*.{js,jsx,ts,tsx}", "../ui/src/**/*.{js,jsx,ts,tsx}"],
	exclude: [],
})
