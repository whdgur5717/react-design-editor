import type { SceneNode } from "@design-editor/core"

import type { Command, EditorReceiver } from "../types"

/**
 * UpdateNodeCommand - 노드 업데이트 (범용)
 * 이전 상태를 저장하여 undo 시 복원
 */
export class UpdateNodeCommand implements Command {
	private readonly previousState: Partial<SceneNode>

	constructor(
		private readonly receiver: EditorReceiver,
		private readonly nodeId: string,
		private readonly updates: Partial<SceneNode>,
	) {
		// 생성 시점에 업데이트될 필드의 이전 값 저장
		const node = receiver.findNode(nodeId)
		if (!node) {
			throw new Error(`Node not found: ${nodeId}`)
		}

		// updates에 포함된 키들의 이전 값만 저장
		this.previousState = {}
		for (const key of Object.keys(updates) as (keyof SceneNode)[]) {
			if (key in node) {
				;(this.previousState as Record<string, unknown>)[key] = structuredClone(node[key])
			}
		}
	}

	execute() {
		this.receiver.updateNode(this.nodeId, this.updates)
	}

	undo() {
		this.receiver.updateNode(this.nodeId, this.previousState)
	}
}
