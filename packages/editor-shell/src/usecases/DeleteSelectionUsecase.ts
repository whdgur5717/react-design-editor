import type { CommandHistory } from "../commands/CommandHistory"
import { RemoveNodeCommand } from "../commands/node/RemoveNodeCommand"
import type { EditorReceiver } from "../commands/types"

export class DeleteSelectionUsecase {
	constructor(
		private readonly receiver: EditorReceiver,
		private readonly history: CommandHistory,
	) {}

	run() {
		const selection = this.receiver.getSelection()
		if (selection.length === 0) return

		const topLevelIds = filterToTopLevel(selection, this.receiver)
		if (topLevelIds.length > 1) this.history.beginTransaction()
		for (const id of topLevelIds) {
			this.history.execute(new RemoveNodeCommand(this.receiver, id))
		}
		if (topLevelIds.length > 1) this.history.commitTransaction()

		this.receiver.setSelection([])
	}
}

function filterToTopLevel(selection: string[], receiver: EditorReceiver) {
	return selection.filter((id) => {
		let location = receiver.findNodeLocation(id)
		while (location) {
			if (selection.includes(location.parentId)) return false
			location = receiver.findNodeLocation(location.parentId)
		}
		return true
	})
}
