import type { SceneNode } from "@open-editor-sdk/core"

import type { Command, DocumentCommandReceiver } from "../types"

/**
 * UpdateNodeCommand - 노드 업데이트 (범용)
 * 이전 상태를 저장하여 undo 시 복원
 */
export class UpdateNodeCommand implements Command {
	private readonly previousUpdates: Partial<SceneNode> | null

	constructor(
		private readonly receiver: DocumentCommandReceiver,
		private readonly nodeId: string,
		private readonly updates: Partial<SceneNode>,
	) {
		const node = receiver.findNode(nodeId)
		if (!node) {
			this.previousUpdates = null
			return
		}

		const previousUpdates: Partial<SceneNode> = {}
		for (const key of Object.keys(updates) as (keyof SceneNode)[]) {
			previousUpdates[key] = structuredClone(node[key]) as never
		}
		this.previousUpdates = previousUpdates
	}

	execute() {
		if (!this.previousUpdates) return
		this.receiver.updateNode(this.nodeId, this.updates)
	}

	undo() {
		if (!this.previousUpdates) return
		this.receiver.updateNode(this.nodeId, this.previousUpdates)
	}
}
