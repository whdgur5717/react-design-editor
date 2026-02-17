import { defineConfig, devices } from "@playwright/test"

const SHELL_URL = process.env.SHELL_URL ?? "http://localhost:3000"
const CANVAS_URL = process.env.CANVAS_URL ?? "http://localhost:3001"

export default defineConfig({
	testDir: "./e2e/tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	use: {
		baseURL: SHELL_URL,
		trace: "on-first-retry",
	},
	expect: {
		timeout: 10_000,
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: [
		{
			command: "pnpm --filter @design-editor/canvas dev",
			url: CANVAS_URL,
			reuseExistingServer: !process.env.CI,
		},
		{
			command: "pnpm --filter @design-editor/shell dev",
			url: SHELL_URL,
			reuseExistingServer: !process.env.CI,
		},
	],
})
