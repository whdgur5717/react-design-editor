import { commandHistory, receiver } from "./index"
import { DuplicateNodeCommand, RemoveNodeCommand } from "./node"
import { shortcutRegistry } from "./ShortcutRegistry"

export function registerNodeShortcuts() {
	shortcutRegistry.register("node:delete", () => {
		const selection = receiver.getSelection()
		if (selection.length === 0) return

		if (selection.length > 1) {
			commandHistory.beginTransaction()
		}

		for (const id of selection) {
			const command = new RemoveNodeCommand(receiver, id)
			commandHistory.execute(command)
		}

		if (selection.length > 1) {
			commandHistory.commitTransaction()
		}

		receiver.setSelection([])
	})

	shortcutRegistry.register("node:duplicate", () => {
		const selection = receiver.getSelection()
		if (selection.length === 0) return

		if (selection.length > 1) {
			commandHistory.beginTransaction()
		}

		for (const id of selection) {
			const command = new DuplicateNodeCommand(receiver, id)
			commandHistory.execute(command)
		}

		if (selection.length > 1) {
			commandHistory.commitTransaction()
		}
	})
}
