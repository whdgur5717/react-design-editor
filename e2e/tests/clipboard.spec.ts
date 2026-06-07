import { expect } from "@playwright/test"

import { test } from "../fixtures"

const primaryModifier = process.platform === "darwin" ? "Meta" : "Control"

test.describe("노드 클립보드", () => {
	test("선택된 노드를 복사해서 붙여넣으면 새로운 노드가 offset 위치에 생성된다", async ({ editor }) => {
		await editor.layerRow("root").click()

		const layerRows = editor.page.locator(".layer-row[data-node-id]")
		const beforeCount = await layerRows.count()
		const beforeBox = await editor.selectionBorder.boundingBox()
		expect(beforeBox).not.toBeNull()

		await editor.page.keyboard.press(`${primaryModifier}+C`)
		await editor.page.keyboard.press(`${primaryModifier}+V`)
		await editor.page.waitForTimeout(100)

		await expect(layerRows).toHaveCount(beforeCount + 2)

		const afterBox = await editor.selectionBorder.boundingBox()
		expect(afterBox).not.toBeNull()

		if (!beforeBox || !afterBox) return

		expect(Math.abs(afterBox.x - beforeBox.x - 20)).toBeLessThan(2)
		expect(Math.abs(afterBox.y - beforeBox.y - 20)).toBeLessThan(2)
	})

	test("잘라내기 후 실행 취소를 누르면 노드가 복원된다", async ({ editor }) => {
		await editor.layerRow("root").click()

		const layerRows = editor.page.locator(".layer-row[data-node-id]")
		const beforeCount = await layerRows.count()

		await editor.page.keyboard.press(`${primaryModifier}+X`)
		await editor.page.waitForTimeout(100)
		await expect(layerRows).toHaveCount(beforeCount - 2)

		await editor.page.keyboard.press(`${primaryModifier}+Z`)
		await editor.page.waitForTimeout(100)
		await expect(layerRows).toHaveCount(beforeCount)
	})

	test("입력 필드에서 복사한 텍스트는 내부 노드 클립보드를 덮어쓰지 않는다", async ({ editor }) => {
		const layerRows = editor.page.locator(".layer-row[data-node-id]")

		await editor.layerRow("root").click()
		const beforeCount = await layerRows.count()

		await editor.positionX.click()
		await editor.page.keyboard.press(`${primaryModifier}+A`)
		await editor.page.keyboard.press(`${primaryModifier}+C`)

		await editor.eventTarget.click({ position: { x: 10, y: 10 } })
		await editor.page.keyboard.press(`${primaryModifier}+V`)
		await editor.page.waitForTimeout(100)

		await expect(layerRows).toHaveCount(beforeCount)
	})
})
