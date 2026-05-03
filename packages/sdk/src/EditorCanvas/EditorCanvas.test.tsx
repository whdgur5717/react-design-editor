import { expect, test } from "vitest"
import { page } from "vitest/browser"
import { render } from "vitest-browser-react"
import "../styles/index.css"
import "./EditorCanvas.test.css"

import { EditorCanvas } from "../EditorCanvas"
import { EditorProvider } from "../EditorProvider"
import { EditorRoot } from "../EditorRoot"
import { LayersPanel } from "../LayersPanel"
import { PropertiesPanel } from "../PropertiesPanel"
import { Toolbar } from "../Toolbar"
import { createEditor } from "../createEditor"

function renderSdkEditor() {
	const editor = createEditor()

	return render(
		<EditorProvider editor={editor}>
			<EditorRoot>
				<Toolbar />
				<LayersPanel />
				<EditorCanvas />
				<PropertiesPanel />
			</EditorRoot>
		</EditorProvider>,
	)
}

async function renderSdkEditorAtDesktopSize() {
	await page.viewport(1280, 720)
	return renderSdkEditor()
}

test("SDK 조합은 canvas iframe과 shell UI를 렌더링한다", async () => {
	const screen = await renderSdkEditorAtDesktopSize()

	await expect.element(page.getByTestId("design-editor-canvas-frame")).toBeVisible()
	await expect.element(page.getByTestId("design-editor-event-target")).toBeVisible()
	await expect.element(screen.getByTitle("Select")).toBeVisible()
	await expect.element(screen.getByText("Page 1")).toBeVisible()
	await expect.element(screen.getByTestId("properties-empty")).toBeVisible()

	const canvas = page.frameLocator(page.getByTestId("design-editor-canvas-frame"))
	await expect.element(canvas.getByTestId("canvas-container")).toBeInTheDocument()
	await expect.element(canvas.getByText("Hello, World!")).toBeVisible()
})

test("SDK 조합은 layer 선택 후 properties와 selection overlay를 갱신한다", async () => {
	await renderSdkEditorAtDesktopSize()

	const canvas = page.frameLocator(page.getByTestId("design-editor-canvas-frame"))
	await expect.element(canvas.getByTestId("canvas-container")).toBeInTheDocument()

	await page.getByTestId("layer-row-root").click()

	await expect.element(page.getByTestId("design-tab")).toBeVisible()
	await expect.element(page.getByTestId("style-width")).toHaveValue("400")
	await expect.element(page.getByTestId("selection-border-root")).toBeVisible()
})
