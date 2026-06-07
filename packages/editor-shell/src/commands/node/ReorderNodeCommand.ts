import type { DocumentCommandReceiver } from "../types"

export class ReorderNodeCommand {
	constructor(
		private readonly receiver: DocumentCommandReceiver,
		private readonly parentId: string,
		private readonly fromIndex: number,
		private readonly toIndex: number,
	) {}

	execute() {
		this.receiver.reorderNode(this.parentId, this.fromIndex, this.toIndex)
	}

	undo() {
		this.receiver.reorderNode(this.parentId, this.toIndex, this.fromIndex)
	}
}
