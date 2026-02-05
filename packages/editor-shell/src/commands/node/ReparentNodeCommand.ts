import type { SceneNode } from "@design-editor/core"

import type { Command, EditorReceiver, NodeLocation } from "../types"

export class ReparentNodeCommand implements Command {
	private previousLocation: NodeLocation | null = null
	private previousNode: SceneNode | null = null

	constructor(
		private readonly receiver: EditorReceiver,
		private readonly nodeId: string,
		private readonly newParentId: string,
	) {
		this.previousLocation = receiver.findNodeLocation(nodeId)
		// reparent 시 스타일이 변경되므로 원본 노드 저장
		const node = receiver.findNode(nodeId)
		if (node) {
			this.previousNode = structuredClone(node)
		}
	}

	execute() {
		this.receiver.reparentNode(this.nodeId, this.newParentId)
	}

	undo() {
		if (!this.previousLocation || !this.previousNode) return

		// 현재 위치에서 제거 후 원래 위치에 원본 노드 복원
		this.receiver.removeNode(this.nodeId)
		this.receiver.addNode(this.previousLocation.parentId, this.previousNode, this.previousLocation.index)
	}
}
