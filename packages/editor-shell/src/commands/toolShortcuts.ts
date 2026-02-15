import type { EditorService } from "../services/EditorService"

export function registerToolShortcuts(editor: EditorService) {
	editor.shortcutRegistry.register("tool:select", () => {
		editor.toolRegistry.setActiveTool("select")
	})

	editor.shortcutRegistry.register("tool:frame", () => {
		editor.toolRegistry.setActiveTool("frame")
	})

	editor.shortcutRegistry.register("tool:text", () => {
		editor.toolRegistry.setActiveTool("text")
	})

	editor.shortcutRegistry.register("tool:shape", () => {
		editor.toolRegistry.setActiveTool("shape")
	})
}
