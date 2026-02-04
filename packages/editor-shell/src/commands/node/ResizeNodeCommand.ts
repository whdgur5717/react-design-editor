import type { Size } from "@design-editor/core"

import type { Command, EditorReceiver } from "../types"

/**
 * ResizeNodeCommand - 노드 크기 변경
 */
export class ResizeNodeCommand implements Command {
	constructor(
		private readonly receiver: EditorReceiver,
		private readonly nodeId: string,
		private readonly from: Size,
		private readonly to: Size,
	) {}

	execute() {
		this.receiver.resizeNode(this.nodeId, this.to)
	}

	undo() {
		this.receiver.resizeNode(this.nodeId, this.from)
	}
}
