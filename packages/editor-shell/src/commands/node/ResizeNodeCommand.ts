import type { Size } from "@design-editor/core"

import type { Command, EditorReceiver, MergableCommand } from "../types"

/**
 * ResizeNodeCommand - 노드 크기 변경
 */
export class ResizeNodeCommand implements MergableCommand {
	readonly mergeKey: string

	constructor(
		private readonly receiver: EditorReceiver,
		private readonly nodeId: string,
		private readonly from: Size,
		private to: Size,
		mergeKey: string = "",
	) {
		this.mergeKey = mergeKey
	}

	execute() {
		this.receiver.resizeNode(this.nodeId, this.to)
	}

	undo() {
		this.receiver.resizeNode(this.nodeId, this.from)
	}

	merge(other: Command): boolean {
		if (!(other instanceof ResizeNodeCommand)) return false
		if (other.nodeId !== this.nodeId) return false
		this.to = other.to
		return true
	}
}
