import { defineConfig } from "@pandacss/dev"
import { preset } from "panda-animation"
import { defaultPreset } from "./preset"

export default defineConfig({
	preflight: true,
	include: ["../ui/src/**/*.{ts,tsx}"],
	exclude: [],
	presets: [preset(), "@pandacss/preset-panda", defaultPreset],
	outdir: ".",
})
