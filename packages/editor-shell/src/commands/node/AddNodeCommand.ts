import type { SceneNode } from "@design-editor/core"

import type { Command, EditorReceiver } from "../types"

/**
 * AddNodeCommand - 노드 추가
 * undo 시 추가된 노드 삭제
 */
export class AddNodeCommand implements Command {
	constructor(
		private readonly receiver: EditorReceiver,
		private readonly parentId: string,
		private readonly node: SceneNode,
		private readonly index?: number,
	) {}

	execute() {
		this.receiver.addNode(this.parentId, this.node, this.index)
	}

	undo() {
		this.receiver.removeNode(this.node.id)
	}
}
