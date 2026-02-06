import { commandHistory } from "./index"
import { shortcutRegistry } from "./ShortcutRegistry"

export function registerHistoryShortcuts() {
	shortcutRegistry.register("history:undo", () => {
		commandHistory.undo()
	})

	shortcutRegistry.register("history:redo", () => {
		commandHistory.redo()
	})
}
