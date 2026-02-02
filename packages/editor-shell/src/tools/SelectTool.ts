import type { CanvasKeyEvent, CanvasPointerEvent } from "../events"
import { useEditorStore } from "../store/editor"
import { BaseTool, type DragEndEvent } from "./types"

/**
 * 선택 도구 - 노드 선택 (드래그 이동은 dnd-kit이 처리)
 */
export class SelectTool extends BaseTool {
	override name = "select"
	override cursor = "default"

	override onPointerDown(e: CanvasPointerEvent): void {
		if (e.targetNodeId) {
			// 노드 클릭 → 선택
			if (e.shiftKey) {
				useEditorStore.getState().toggleSelection(e.targetNodeId)
			} else {
				useEditorStore.getState().setSelection([e.targetNodeId])
			}
			// 드래그는 dnd-kit이 처리하므로 히스토리 pause 불필요
		} else {
			// 빈 공간 클릭 → 선택 해제
			useEditorStore.getState().setSelection([])
		}
	}

	override onPointerMove(_e: CanvasPointerEvent): void {
		// 드래그 이동은 dnd-kit이 처리
		// hover 처리만 필요하면 여기에 추가
	}

	override onDragEnd(_e: DragEndEvent): void {
		// 드래그는 dnd-kit이 처리 (onCanvasDndEnd → dropNode)
	}

	override onKeyDown(e: CanvasKeyEvent): void {
		// 방향키로 미세 이동 (선택된 노드가 있을 때)
		const selection = useEditorStore.getState().selection
		if (selection.length === 0) return

		const delta = e.shiftKey ? 10 : 1
		let dx = 0
		let dy = 0

		switch (e.key) {
			case "ArrowUp":
				dy = -delta
				break
			case "ArrowDown":
				dy = delta
				break
			case "ArrowLeft":
				dx = -delta
				break
			case "ArrowRight":
				dx = delta
				break
			default:
				return
		}

		// 선택된 모든 노드 이동
		for (const nodeId of selection) {
			const node = useEditorStore.getState().findNode(nodeId)
			if (node) {
				const currentLeft = typeof node.style?.left === "number" ? node.style.left : 0
				const currentTop = typeof node.style?.top === "number" ? node.style.top : 0

				useEditorStore.getState().moveNode(nodeId, {
					x: currentLeft + dx,
					y: currentTop + dy,
				})
			}
		}
	}
}
