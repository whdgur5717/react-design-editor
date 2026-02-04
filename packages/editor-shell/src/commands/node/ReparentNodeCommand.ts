import type { Command, EditorReceiver, NodeLocation } from "../types"

export class ReparentNodeCommand implements Command {
	private previousLocation: NodeLocation | null = null

	constructor(
		private readonly receiver: EditorReceiver,
		private readonly nodeId: string,
		private readonly newParentId: string,
	) {
		this.previousLocation = receiver.findNodeLocation(nodeId)
	}

	execute() {
		this.receiver.reparentNode(this.nodeId, this.newParentId)
	}

	undo() {
		if (this.previousLocation) {
			this.receiver.reparentNode(this.nodeId, this.previousLocation.parentId)
		}
	}
}
