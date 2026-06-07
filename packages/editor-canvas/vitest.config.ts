import { defineConfig } from "vitest/config"
import { playwright } from "@vitest/browser-playwright"

export default defineConfig({
	optimizeDeps: {
		include: ["react/jsx-dev-runtime"],
	},
	test: {
		browser: {
			enabled: true,
			provider: playwright(),
			instances: [{ browser: "chromium" }],
			headless: true,
		},
		include: ["src/**/*.test.{ts,tsx}"],
	},
})
