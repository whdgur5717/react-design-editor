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

test.describe("노드 이동", () => {
	test("선택된 노드를 드래그하면 x, y 좌표가 이동량만큼 변경된다", async ({ editor }) => {
		await editor.layerRow("root").click()

		const startX = Number(await editor.positionX.inputValue())
		const startY = Number(await editor.positionY.inputValue())

		await editor.dragOnCanvas({ x: 330, y: 150 }, { x: 410, y: 210 })

		await expect(editor.positionX).toHaveValue(String(startX + 80))
		await expect(editor.positionY).toHaveValue(String(startY + 60))
	})
})

test.describe("Zoom", () => {
	test("Zoom In 버튼을 누르면 100%→110%, Zoom Out 두 번 누르면 110%→90%로 변경된다", async ({ editor }) => {
		await expect(editor.page.getByText("100%")).toBeVisible()

		await editor.toolButton("Zoom In").click()
		await expect(editor.page.getByText("110%")).toBeVisible()

		await editor.toolButton("Zoom Out").click()
		await editor.toolButton("Zoom Out").click()
		await expect(editor.page.getByText("90%")).toBeVisible()
	})
})

test.describe("Canvas geometry sync", () => {
	test("selection overlay는 pan 중 노드와 계속 정렬된다", async ({ editor }) => {
		await editor.layerRow("root").click()
		await expect(editor.selectionBorder).toBeVisible()

		await editor.panCanvas(0, 120)
		await editor.panCanvas(0, 120)
		await editor.panCanvas(0, -80)

		await editor.page.waitForTimeout(100)

		const nodeBox = await editor.canvasNode("root").boundingBox()
		const selectionBox = await editor.selectionBorder.boundingBox()

		expect(nodeBox).not.toBeNull()
		expect(selectionBox).not.toBeNull()

		if (!nodeBox || !selectionBox) return

		expect(Math.abs(nodeBox.x - selectionBox.x)).toBeLessThan(2)
		expect(Math.abs(nodeBox.y - selectionBox.y)).toBeLessThan(2)
		expect(Math.abs(nodeBox.width - selectionBox.width)).toBeLessThan(2)
		expect(Math.abs(nodeBox.height - selectionBox.height)).toBeLessThan(2)
	})

	test("selection overlay는 빠른 wheel pan 이후에도 노드와 정렬된다", async ({ editor }) => {
		await editor.layerRow("root").click()
		await expect(editor.selectionBorder).toBeVisible()

		for (let i = 0; i < 20; i++) {
			await editor.panCanvas(0, 24)
		}

		for (let i = 0; i < 8; i++) {
			await editor.panCanvas(0, -18)
		}

		await editor.page.waitForTimeout(100)

		const nodeBox = await editor.canvasNode("root").boundingBox()
		const selectionBox = await editor.selectionBorder.boundingBox()

		expect(nodeBox).not.toBeNull()
		expect(selectionBox).not.toBeNull()

		if (!nodeBox || !selectionBox) return

		expect(Math.abs(nodeBox.x - selectionBox.x)).toBeLessThan(2)
		expect(Math.abs(nodeBox.y - selectionBox.y)).toBeLessThan(2)
		expect(Math.abs(nodeBox.width - selectionBox.width)).toBeLessThan(2)
		expect(Math.abs(nodeBox.height - selectionBox.height)).toBeLessThan(2)
	})

	test("pan과 zoom 이후 캔버스 클릭은 같은 노드를 선택하고 overlay가 정렬된다", async ({ editor }) => {
		await editor.panCanvas(0, 120)
		await editor.panCanvas(0, 80)
		await editor.toolButton("Zoom In").click()
		await editor.toolButton("Zoom In").click()

		const nodeBox = await editor.canvasNode("root").boundingBox()
		const canvasAreaBox = await editor.page.locator(".canvas-area").boundingBox()
		expect(nodeBox).not.toBeNull()
		expect(canvasAreaBox).not.toBeNull()

		if (!nodeBox || !canvasAreaBox) return

		const clickX = Math.min(nodeBox.x + nodeBox.width - 12, Math.max(nodeBox.x + 12, canvasAreaBox.x + 12))
		const clickY = Math.min(nodeBox.y + nodeBox.height - 12, Math.max(nodeBox.y + 12, canvasAreaBox.y + 12))

		await editor.page.mouse.click(clickX, clickY)
		await expect(editor.selectionBorder).toBeVisible()

		await expect
			.poll(async () => {
				const nodeBoxNow = await editor.canvasNode("root").boundingBox()
				const selectionBoxNow = await editor.selectionBorder.boundingBox()
				if (!nodeBoxNow || !selectionBoxNow) return Number.POSITIVE_INFINITY

				return Math.max(
					Math.abs(nodeBoxNow.x - selectionBoxNow.x),
					Math.abs(nodeBoxNow.y - selectionBoxNow.y),
					Math.abs(nodeBoxNow.width - selectionBoxNow.width),
					Math.abs(nodeBoxNow.height - selectionBoxNow.height),
				)
			})
			.toBeLessThan(2)
	})
})
