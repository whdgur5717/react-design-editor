import type { CommandHistory } from "../commands/CommandHistory"
import { DuplicateNodeCommand } from "../commands/node/DuplicateNodeCommand"
import type { EditorReceiver } from "../commands/types"

export class DuplicateSelectionUsecase {
	constructor(
		private readonly receiver: EditorReceiver,
		private readonly history: CommandHistory,
	) {}

	run() {
		const selection = this.receiver.getSelection()
		if (selection.length === 0) return

		if (selection.length > 1) this.history.beginTransaction()
		for (const id of selection) {
			this.history.execute(new DuplicateNodeCommand(this.receiver, id))
		}
		if (selection.length > 1) this.history.commitTransaction()
	}
}
