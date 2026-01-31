import type { CanvasPointerEvent } from "../events"
import { useEditorStore } from "../store/editor"
import { createTextNode } from "./nodeFactory"
import { BaseTool } from "./types"

/**
 * Text 도구 - 드래그로 Text 노드 생성
 */
export class TextTool extends BaseTool {
	override name = "text"
	override cursor = "crosshair"

	private startX = 0
	private startY = 0
	private createdNodeId: string | null = null

	override onPointerDown(e: CanvasPointerEvent): void {
		this.startX = e.clientX
		this.startY = e.clientY

		// 최소 크기로 노드 즉시 생성
		const node = createTextNode(e.clientX, e.clientY, 100)
		const pageId = useEditorStore.getState().currentPageId
		useEditorStore.getState().addNode(pageId, node)
		useEditorStore.getState().setSelection([node.id])
		this.createdNodeId = node.id

		useEditorStore.temporal.getState().pause()
	}

	override onPointerMove(e: CanvasPointerEvent): void {
		if (!this.createdNodeId) return

		const left = Math.min(this.startX, e.clientX)
		const top = Math.min(this.startY, e.clientY)
		const width = Math.max(Math.abs(e.clientX - this.startX), 50)

		useEditorStore.getState().moveNode(this.createdNodeId, { x: left, y: top })
		useEditorStore.getState().resizeNode(this.createdNodeId, { width, height: "auto" })
	}

	override onDragEnd(): void {
		if (!this.createdNodeId) return

		useEditorStore.temporal.getState().resume()
		useEditorStore.getState().setActiveTool("select")
		this.createdNodeId = null
	}

	override onDeactivate(): void {
		this.createdNodeId = null
	}
}
