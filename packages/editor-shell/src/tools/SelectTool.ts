import type { ClickPayload, DragPayload, KeyPayload } from "@design-editor/core"

import { MoveNodeCommand, ReparentNodeCommand } from "../commands"
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

		if (payload.overNodeId && payload.overNodeId !== location.parentId) {
			const command = new ReparentNodeCommand(receiver, nodeId, payload.overNodeId)
			this.service.executeCommand(command)
		} else {
			const currentLeft = typeof node.style?.left === "number" ? node.style.left : 0
			const currentTop = typeof node.style?.top === "number" ? node.style.top : 0
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

		if (selection.length > 1) {
			this.service.beginTransaction()
		}

		for (const id of selection) {
			const node = this.service.findNode(id)
			if (!node) continue

			const currentLeft = typeof node.style?.left === "number" ? node.style.left : 0
			const currentTop = typeof node.style?.top === "number" ? node.style.top : 0
			const from = { x: currentLeft, y: currentTop }
			const to = { x: currentLeft + dx, y: currentTop + dy }

			const command = new MoveNodeCommand(receiver, id, from, to)
			this.service.executeCommand(command)
		}

		if (selection.length > 1) {
			this.service.commitTransaction()
		}
	}
}
