import type { SceneNode } from "@design-editor/core"

import type { Command, EditorReceiver, NodeLocation } from "../types"

/**
 * RemoveNodeCommand - 노드 삭제
 * undo 시 삭제된 노드 복원 (같은 부모, 같은 인덱스)
 */
export class RemoveNodeCommand implements Command {
	private readonly removedNode: SceneNode
	private readonly location: NodeLocation

	constructor(
		private readonly receiver: EditorReceiver,
		private readonly nodeId: string,
	) {
		// 생성 시점에 복원에 필요한 정보 저장
		const node = receiver.findNode(nodeId)
		if (!node) {
			throw new Error(`Node not found: ${nodeId}`)
		}
		this.removedNode = structuredClone(node)

		const location = receiver.findNodeLocation(nodeId)
		if (!location) {
			throw new Error(`Node location not found: ${nodeId}`)
		}
		this.location = location
	}

	execute() {
		this.receiver.removeNode(this.nodeId)
	}

	undo() {
		this.receiver.addNode(this.location.parentId, this.removedNode, this.location.index)
	}
}
