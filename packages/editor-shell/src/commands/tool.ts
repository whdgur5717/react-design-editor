import { toolRegistry } from "../tools"
import { commandRegistry } from "./CommandRegistry"

/**
 * Tool 관련 Command 등록
 */
export function registerToolCommands(): void {
	commandRegistry.register("tool:select", () => {
		toolRegistry.setActiveTool("select")
	})

	commandRegistry.register("tool:frame", () => {
		toolRegistry.setActiveTool("frame")
	})

	commandRegistry.register("tool:text", () => {
		toolRegistry.setActiveTool("text")
	})

	commandRegistry.register("tool:shape", () => {
		toolRegistry.setActiveTool("shape")
	})
}
