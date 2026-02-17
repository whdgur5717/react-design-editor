import { expect, type FrameLocator, type Locator, type Page } from "@playwright/test"

export class EditorPage {
	readonly canvas: FrameLocator
	private readonly overlay: Locator

	constructor(readonly page: Page) {
		this.canvas = page.frameLocator("#canvas-iframe")
		this.overlay = page.locator("#canvas-event-target")
	}

	// ── Lifecycle ──

	async goto() {
		await this.page.goto("/")
	}

	async waitForReady() {
		await expect(this.page.locator(".app")).toBeVisible()
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
		return this.page.locator(`.layer-row[data-node-id="${nodeId}"]`)
	}

	// ── Toolbar ──

	toolButton(name: string) {
		return this.page.locator(`.toolbar-button[title="${name}"]`)
	}

	// ── Properties panel ──

	get propX() {
		return this.page.locator('[data-testid="prop-x"]')
	}
	get propY() {
		return this.page.locator('[data-testid="prop-y"]')
	}
	get propW() {
		return this.page.locator('[data-testid="prop-w"]')
	}
	get propH() {
		return this.page.locator('[data-testid="prop-h"]')
	}
	get propFill() {
		return this.page.locator('[data-testid="prop-fill"]')
	}
	get propertiesEmpty() {
		return this.page.locator('[data-testid="properties-empty"]')
	}
	get designTab() {
		return this.page.locator('[data-testid="design-tab"]')
	}
	get selectionBorder() {
		return this.page.locator(".selection-border")
	}

	resizeHandle(name: string) {
		return this.page.locator(`[data-resize-handle="${name}"]`)
	}
}
