import type { Position } from "@design-editor/core"

import type { Command, EditorReceiver } from "../types"

/**
 * MoveNodeCommand - 노드 위치 이동
 */
export class MoveNodeCommand implements Command {
	constructor(
		private readonly receiver: EditorReceiver,
		private readonly nodeId: string,
		private readonly from: Position,
		private readonly to: Position,
	) {}

	execute() {
		this.receiver.moveNode(this.nodeId, this.to)
	}

	undo() {
		this.receiver.moveNode(this.nodeId, this.from)
	}
}
