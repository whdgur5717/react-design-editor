import type { CanvasPointerEvent } from "../events"
import { useEditorStore } from "../store/editor"
import { createFrameNode } from "./nodeFactory"
import { BaseTool } from "./types"

/**
 * Frame 도구 - 드래그로 Frame 노드 생성
 */
export class FrameTool extends BaseTool {
	override name = "frame"
	override cursor = "crosshair"

	private startX = 0
	private startY = 0
	private createdNodeId: string | null = null

	override onPointerDown(e: CanvasPointerEvent) {
		this.startX = e.clientX
		this.startY = e.clientY

		// 최소 크기로 노드 즉시 생성
		const node = createFrameNode(e.clientX, e.clientY, 1, 1)
		const pageId = useEditorStore.getState().currentPageId
		useEditorStore.getState().addNode(pageId, node)
		useEditorStore.getState().setSelection([node.id])
		this.createdNodeId = node.id

		// 히스토리 일시정지 (드래그 중 변경 합치기)
		useEditorStore.temporal.getState().pause()
	}

	override onPointerMove(e: CanvasPointerEvent) {
		if (!this.createdNodeId) return

		// 드래그 영역 계산
		const left = Math.min(this.startX, e.clientX)
		const top = Math.min(this.startY, e.clientY)
		const width = Math.max(Math.abs(e.clientX - this.startX), 10)
		const height = Math.max(Math.abs(e.clientY - this.startY), 10)

		// 위치와 크기 업데이트
		useEditorStore.getState().moveNode(this.createdNodeId, { x: left, y: top })
		useEditorStore.getState().resizeNode(this.createdNodeId, { width, height })
	}

	override onDragEnd(): void {
		if (!this.createdNodeId) return

		// 히스토리 재개
		useEditorStore.temporal.getState().resume()

		// SelectTool로 전환
		useEditorStore.getState().setActiveTool("select")
		this.createdNodeId = null
	}

	override onDeactivate(): void {
		this.createdNodeId = null
	}
}
