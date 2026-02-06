import type { Command, EditorReceiver } from "../types"

export class DuplicateNodeCommand implements Command {
	private createdNodeId: string | null = null

	constructor(
		private readonly receiver: EditorReceiver,
		private readonly nodeId: string,
	) {}

	execute() {
		this.createdNodeId = this.receiver.duplicateNode(this.nodeId)
	}

	undo() {
		if (this.createdNodeId) {
			this.receiver.removeNode(this.createdNodeId)
		}
	}
}
