import type { EditorService } from "../services/EditorService"

export function registerHistoryShortcuts(editor: EditorService) {
	editor.shortcutRegistry.register("history:undo", () => {
		editor.commandHistory.undo()
	})

	editor.shortcutRegistry.register("history:redo", () => {
		editor.commandHistory.redo()
	})
}
