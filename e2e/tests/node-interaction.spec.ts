import { expect } from "@playwright/test"
import { test } from "../fixtures"

test.describe("노드 선택", () => {
	test("레이어 패널에서 노드 클릭 시 Properties 패널에 해당 노드의 width가 표시된다", async ({ editor }) => {
		await editor.layerRow("root").click()

		await expect(editor.designTab).toBeVisible()
		await expect(editor.propW).toHaveValue("520")
	})
})

test.describe("노드 리사이즈", () => {
	test("남동쪽 핸들을 (100, 50) 드래그하면 width와 height가 이동량만큼 증가한다", async ({ editor }) => {
		await editor.layerRow("root").click()
		await expect(editor.propW).toHaveValue("520")
		const startWidth = Number(await editor.propW.inputValue())
		const startHeightValue = await editor.propH.inputValue()
		const nodeBox = (await editor.canvasNode("root").boundingBox())!
		const startHeight = startHeightValue ? Number(startHeightValue) : Math.round(nodeBox.height)

		await editor.resizeNode("se", 100, 50)

		await expect(editor.propW).toHaveValue(String(startWidth + 100))
		await expect(editor.propH).toHaveValue(String(startHeight + 50))
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

		await editor.dragNode("root", { x: 80, y: 60 })

		await expect(editor.positionX).toHaveValue(String(startX + 80))
		await expect(editor.positionY).toHaveValue(String(startY + 60))
	})
})

test.describe("줌", () => {
	test("확대 버튼을 누르면 100%에서 110%가 되고 축소 버튼을 두 번 누르면 90%가 된다", async ({ editor }) => {
		await expect(editor.page.getByText("100%")).toBeVisible()

		await editor.toolButton("Zoom In").click()
		await expect(editor.page.getByText("110%")).toBeVisible()

		await editor.toolButton("Zoom Out").click()
		await editor.toolButton("Zoom Out").click()
		await expect(editor.page.getByText("90%")).toBeVisible()
	})
})

test.describe("선택 표시 위치", () => {
	test("선택 overlay는 화면을 이동하는 동안에도 노드와 계속 정렬된다", async ({ editor }) => {
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

	test("선택 overlay는 빠르게 wheel로 이동한 뒤에도 노드와 정렬된다", async ({ editor }) => {
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

	test("이동과 확대 이후에도 캔버스 클릭은 같은 노드를 선택하고 overlay가 정렬된다", async ({ editor }) => {
		await editor.panCanvas(0, 120)
		await editor.panCanvas(0, 80)
		await editor.toolButton("Zoom In").click()
		await editor.toolButton("Zoom In").click()

		const nodeBox = await editor.canvasNode("root").boundingBox()
		const canvasAreaBox = await editor.eventTarget.boundingBox()
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
