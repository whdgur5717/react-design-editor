import { toolRegistry } from "../tools"
import { shortcutRegistry } from "./ShortcutRegistry"

export function registerToolShortcuts() {
	shortcutRegistry.register("tool:select", () => {
		toolRegistry.setActiveTool("select")
	})

	shortcutRegistry.register("tool:frame", () => {
		toolRegistry.setActiveTool("frame")
	})

	shortcutRegistry.register("tool:text", () => {
		toolRegistry.setActiveTool("text")
	})

	shortcutRegistry.register("tool:shape", () => {
		toolRegistry.setActiveTool("shape")
	})
}
