import { expect } from "@playwright/test"
import { test } from "../fixtures"

test.describe("에디터 초기화", () => {
	test("Shell과 Canvas iframe이 Penpal로 연결되어 초기 노드가 렌더링된다", async ({ editor }) => {
		await expect(editor.canvas.locator("#canvas-container")).toBeAttached()
		await editor.layerRow("root").click()
		await expect(editor.propW).toHaveValue("999")
	})

	test("레이어 패널에서 노드를 클릭하면 Properties 패널에 해당 노드 속성이 표시된다", async ({ editor }) => {
		await expect(editor.propertiesEmpty).toBeVisible()

		await editor.layerRow("root").click()

		await expect(editor.designTab).toBeVisible()
		await expect(editor.propertiesEmpty).not.toBeVisible()
		await expect(editor.selectionBorder).toBeVisible()
	})
})
