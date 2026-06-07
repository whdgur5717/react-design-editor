import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		projects: ["packages/editor-*", "packages/sdk"],
	},
})
