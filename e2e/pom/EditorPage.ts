import { expect, type Locator, type Page } from "@playwright/test"

export class EditorPage {
	readonly canvas: Locator
	private readonly overlay: Locator

	constructor(readonly page: Page) {
		this.canvas = page.getByTestId("canvas-container")
		this.overlay = page.getByTestId("design-editor-event-target")
	}

	// ── Lifecycle ──

	async goto(path = "/") {
		await this.page.goto(path)
	}

	async waitForReady() {
		await expect(this.page.locator(".de-editor-root")).toBeVisible()
		await expect(this.canvas).toBeAttached()
		await expect(this.canvas.locator("[data-node-id]").first()).toBeAttached()
	}

	// ── Canvas interaction (shell overlay 위에서 수행) ──

	async clickCanvas(x: number, y: number) {
		await this.overlay.click({ position: { x, y } })
	}

	async dragOnCanvas(from: { x: number; y: number }, to: { x: number; y: number }, steps = 5) {
		await this.overlay.hover({ position: from })
		await this.page.mouse.down()

		const box = (await this.overlay.boundingBox())!
		await this.page.mouse.move(box.x + to.x, box.y + to.y, { steps })
		await this.page.mouse.up()
	}

	async dragNode(nodeId: string, delta: { x: number; y: number }, steps = 5) {
		const nodeBox = (await this.canvasNode(nodeId).boundingBox())!
		const overlayBox = (await this.overlay.boundingBox())!

		const from = {
			x: nodeBox.x + Math.min(24, nodeBox.width / 2) - overlayBox.x,
			y: nodeBox.y + Math.min(24, nodeBox.height / 2) - overlayBox.y,
		}
		await this.dragOnCanvas(from, { x: from.x + delta.x, y: from.y + delta.y }, steps)
	}

	async panCanvas(deltaX: number, deltaY: number, position = { x: 330, y: 150 }) {
		await this.overlay.hover({ position })
		await this.page.mouse.wheel(deltaX, deltaY)
	}

	// ── Resize ──

	async resizeNode(handle: string, dx: number, dy: number, steps = 5) {
		const handleEl = this.page.locator(`[data-resize-handle="${handle}"]`)
		await handleEl.hover()

		const box = (await handleEl.boundingBox())!
		const cx = box.x + box.width / 2
		const cy = box.y + box.height / 2

		await this.page.mouse.down()
		await this.page.mouse.move(cx + dx, cy + dy, { steps })
		await this.page.mouse.up()
	}

	// ── Node queries ──

	canvasNode(nodeId: string) {
		return this.canvas.locator(`[data-node-id="${nodeId}"]`)
	}

	layerRow(nodeId: string) {
		return this.page.getByTestId(`layer-row-${nodeId}`)
	}

	// ── Toolbar ──

	toolButton(name: string) {
		return this.page.getByTitle(name)
	}

	// ── Properties panel ──

	get positionX() {
		return this.page.getByTestId("position-x")
	}
	get positionY() {
		return this.page.getByTestId("position-y")
	}
	get propW() {
		return this.page.getByTestId("style-width")
	}
	get propH() {
		return this.page.getByTestId("style-height")
	}
	get propFill() {
		return this.page.getByTestId("style-backgroundColor")
	}
	get propertiesEmpty() {
		return this.page.getByTestId("properties-empty")
	}
	get designTab() {
		return this.page.getByTestId("design-tab")
	}
	get selectionBorder() {
		return this.page.locator(".selection-border")
	}
	get eventTarget() {
		return this.overlay
	}

	resizeHandle(name: string) {
		return this.page.locator(`[data-resize-handle="${name}"]`)
	}
}
