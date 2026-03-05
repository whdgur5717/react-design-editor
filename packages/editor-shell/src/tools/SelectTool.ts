import type { ClickPayload, DragPayload, KeyPayload, PageNode } from "@design-editor/core"

import { MoveNodeCommand, ReparentNodeCommand } from "../commands"
import { getAbsolutePosition, isRootNode } from "../utils/nodePosition"
import type { ToolService } from "./ToolService"
import { BaseTool } from "./types"

/**
 * 드롭 대상으로부터 올바른 부모를 결정한다.
 */
function resolveDropParent(
	overNodeId: string | undefined,
	draggedNodeId: string,
	currentParentId: string,
	page: PageNode,
	service: ToolService,
): string {
	// 자기 자신 위에 드롭 → 현재 부모 유지
	if (overNodeId === draggedNodeId) return currentParentId

	// 빈 캔버스에 드롭 → page
	if (!overNodeId) return page.id

	const target = service.findNode(overNodeId)
	if (!target) return page.id

	// 텍스트에는 자식을 넣을 수 없음 → 그 노드의 부모로
	if (target.type === "text") {
		const targetLocation = service.findNodeLocation(overNodeId)
		return targetLocation?.parentId ?? page.id
	}

	// ElementNode (프레임 등) → 그 안으로 reparent
	return overNodeId
}

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

		const currentLeft = payload.initialPosition?.x ?? node.x ?? 0
		const currentTop = payload.initialPosition?.y ?? node.y ?? 0

		const targetParentId = resolveDropParent(payload.overNodeId, nodeId, location.parentId, page, this.service)

		if (targetParentId !== location.parentId) {
			// 부모 변경 → reparent + 좌표 변환
			const oldParentAbs = getAbsolutePosition(location.parentId, page)
			const newParentAbs = getAbsolutePosition(targetParentId, page)

			const from = { x: currentLeft, y: currentTop }
			const to = {
				x: oldParentAbs.x + currentLeft + payload.delta.x - newParentAbs.x,
				y: oldParentAbs.y + currentTop + payload.delta.y - newParentAbs.y,
			}

			this.service.beginTransaction()
			this.service.executeCommand(new ReparentNodeCommand(receiver, nodeId, targetParentId))
			this.service.executeCommand(new MoveNodeCommand(receiver, nodeId, from, to))
			this.service.commitTransaction()
		} else {
			// 같은 부모 → 이동만
			const from = { x: currentLeft, y: currentTop }
			const to = { x: currentLeft + payload.delta.x, y: currentTop + payload.delta.y }
			this.service.executeCommand(new MoveNodeCommand(receiver, nodeId, from, to))
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
