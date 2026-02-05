import type { SceneNode } from "@design-editor/core"

import type { Command, EditorReceiver } from "../types"

/**
 * UpdateNodeCommand - 노드 업데이트 (범용)
 * 이전 상태를 저장하여 undo 시 복원
 * TODO: structuredClone 관련 검증 필요
 */
export class UpdateNodeCommand implements Command {
	private readonly previousNode: SceneNode | null

	constructor(
		private readonly receiver: EditorReceiver,
		private readonly nodeId: string,
		private readonly updates: Partial<SceneNode>,
	) {
		const node = receiver.findNode(nodeId)
		this.previousNode = node ? structuredClone(node) : null
	}

	execute() {
		if (!this.previousNode) return
		this.receiver.updateNode(this.nodeId, this.updates)
	}

	undo() {
		if (!this.previousNode) return
		this.receiver.updateNode(this.nodeId, this.previousNode)
	}
}
