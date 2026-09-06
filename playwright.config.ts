import { defineConfig, devices } from "@playwright/test"

const DEMO_URL = process.env.DEMO_URL ?? "http://127.0.0.1:3137"

export default defineConfig({
	testDir: "./e2e/tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	use: {
		baseURL: DEMO_URL,
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
	webServer: {
		command: "pnpm --filter @open-editor-sdk/demo exec vite --host 127.0.0.1 --port 3137",
		url: DEMO_URL,
		reuseExistingServer: false,
	},
})
