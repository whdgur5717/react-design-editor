import { defineConfig } from "tsdown"

export default defineConfig({
	entry: {
		index: "src/index.tsx",
	},
	format: ["esm"],
	dts: true,
	clean: true,
	target: "es2022",
	platform: "browser",
	deps: {
		neverBundle: [/^@design-editor\//],
	},
	outExtensions: () => ({ js: ".js" }),
})
