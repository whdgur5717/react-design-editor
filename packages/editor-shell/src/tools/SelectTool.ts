import type { ClickPayload, DragPayload, KeyPayload } from "@design-editor/core"

import { MoveNodeCommand, ReparentNodeCommand } from "../commands"
import { getAbsolutePosition, isRootNode } from "../utils/nodePosition"
import { BaseTool } from "./types"

/**
 * 선택 도구 - 노드 선택, 이동, 키보드 미세 조정
 */
export class SelectTool extends BaseTool {
	override name = "select"
	override cursor = "default"

	override onClick(nodeId: string | null, payload: ClickPayload): void {
		if (nodeId) {
			if (payload.shiftKey) {
				this.service.toggleSelection(nodeId)
			} else {
				this.service.setSelection([nodeId])
			}
		} else {
			this.service.setSelection([])
		}
	}

	override onDragEnd(nodeId: string | null, payload: DragPayload): void {
		if (!nodeId || !payload.delta) return

		const node = this.service.findNode(nodeId)
		if (!node) return

		const location = this.service.findNodeLocation(nodeId)
		if (!location) return

		const receiver = this.service.getReceiver()
		const page = receiver.getCurrentPage()
		if (!page) return

		// 레이아웃 자식은 이동 불가 (snap back)
		if (!isRootNode(nodeId, page)) return

		const currentLeft = payload.initialPosition?.x ?? node.x ?? 0
		const currentTop = payload.initialPosition?.y ?? node.y ?? 0
		const newParentId = payload.overNodeId
		const isReparent = newParentId && newParentId !== location.parentId

		if (isReparent) {
			// reparent 가드
			if (newParentId === nodeId) return
			const targetNode = this.service.findNode(newParentId)
			if (!targetNode) return
			if (targetNode.type === "text") return

			const oldParentAbs = getAbsolutePosition(location.parentId, page)
			const newParentAbs = getAbsolutePosition(newParentId, page)

			const from = { x: currentLeft, y: currentTop }
			const to = {
				x: oldParentAbs.x + currentLeft + payload.delta.x - newParentAbs.x,
				y: oldParentAbs.y + currentTop + payload.delta.y - newParentAbs.y,
			}

			this.service.beginTransaction()
			this.service.executeCommand(new ReparentNodeCommand(receiver, nodeId, newParentId))
			this.service.executeCommand(new MoveNodeCommand(receiver, nodeId, from, to))
			this.service.commitTransaction()
		} else {
			const from = { x: currentLeft, y: currentTop }
			const to = { x: currentLeft + payload.delta.x, y: currentTop + payload.delta.y }
			const command = new MoveNodeCommand(receiver, nodeId, from, to)
			this.service.executeCommand(command)
		}
	}

	override onKeyDown(payload: KeyPayload): void {
		const selection = this.service.getSelection()
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

		const receiver = this.service.getReceiver()
		const page = receiver.getCurrentPage()
		if (!page) return

		// 루트 노드만 nudge 가능
		const rootSelection = selection.filter((id) => isRootNode(id, page))
		if (rootSelection.length === 0) return

		if (rootSelection.length > 1) {
			this.service.beginTransaction()
		}

		for (const id of rootSelection) {
			const node = this.service.findNode(id)
			if (!node) continue

			const currentLeft = node.x ?? 0
			const currentTop = node.y ?? 0
			const from = { x: currentLeft, y: currentTop }
			const to = { x: currentLeft + dx, y: currentTop + dy }

			const command = new MoveNodeCommand(receiver, id, from, to)
			this.service.executeCommand(command)
		}

		if (rootSelection.length > 1) {
			this.service.commitTransaction()
		}
	}
}
