import { test as base } from "@playwright/test"

import { EditorPage } from "./pom/EditorPage"

export const test = base.extend<{ editor: EditorPage }>({
	editor: async ({ page }, use) => {
		const editor = new EditorPage(page)
		await editor.goto()
		await editor.waitForReady()
		await use(editor)
	},
})
