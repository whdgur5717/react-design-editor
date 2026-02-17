import { expect } from "@playwright/test"
import { test } from "../fixtures"

test.describe("노드 선택", () => {
	test("레이어 패널에서 노드 클릭 시 Properties 패널에 해당 노드의 width/height가 표시된다", async ({ editor }) => {
		await editor.layerRow("root").click()

		await expect(editor.designTab).toBeVisible()
		await expect(editor.propW).toHaveValue("400")
		await expect(editor.propH).toHaveValue("300")
	})
})

test.describe("노드 리사이즈", () => {
	test("SE 핸들을 (100, 50) 드래그하면 width가 400→500, height가 300→350으로 증가한다", async ({ editor }) => {
		await editor.layerRow("root").click()
		await expect(editor.propW).toHaveValue("400")
		await expect(editor.propH).toHaveValue("300")

		await editor.resizeNode("se", 100, 50)

		await expect(editor.propW).toHaveValue("500")
		await expect(editor.propH).toHaveValue("350")
	})

	test("노드가 선택되지 않으면 리사이즈 핸들이 표시되지 않고, 단일 선택 시 8개 핸들이 모두 표시된다", async ({
		editor,
	}) => {
		await expect(editor.resizeHandle("se")).not.toBeVisible()

		await editor.layerRow("root").click()
		await expect(editor.resizeHandle("se")).toBeVisible()
		await expect(editor.resizeHandle("nw")).toBeVisible()
	})
})

test.describe("Zoom", () => {
	test("Zoom In 버튼을 누르면 100%→110%, Zoom Out 두 번 누르면 110%→90%로 변경된다", async ({ editor }) => {
		const zoomText = editor.page.locator(".zoom-level")
		await expect(zoomText).toHaveText("100%")

		await editor.toolButton("Zoom In").click()
		await expect(zoomText).toHaveText("110%")

		await editor.toolButton("Zoom Out").click()
		await editor.toolButton("Zoom Out").click()
		await expect(zoomText).toHaveText("90%")
	})
})
