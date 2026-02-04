import type { ClickPayload, KeyPayload } from "@design-editor/core"

import { useEditorStore } from "../store/editor"
import { BaseTool } from "./types"

/**
 * 선택 도구 - 노드 선택 (드래그 이동은 dnd-kit이 처리)
 */
export class SelectTool extends BaseTool {
	override name = "select"
	override cursor = "default"

	override onClick(nodeId: string | null, payload: ClickPayload): void {
		if (nodeId) {
			// 노드 클릭 → 선택
			if (payload.shiftKey) {
				useEditorStore.getState().toggleSelection(nodeId)
			} else {
				useEditorStore.getState().setSelection([nodeId])
			}
		} else {
			// 빈 공간 클릭 → 선택 해제
			useEditorStore.getState().setSelection([])
		}
	}

	override onKeyDown(payload: KeyPayload): void {
		// 방향키로 미세 이동 (선택된 노드가 있을 때)
		const selection = useEditorStore.getState().selection
		if (selection.length === 0) return

		const delta = payload.shiftKey ? 10 : 1
		let dx = 0
		let dy = 0

		switch (payload.key) {
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
