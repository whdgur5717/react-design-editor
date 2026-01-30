import { useEditorStore } from "../store/editor"
import { commandRegistry } from "./CommandRegistry"

/**
 * History 관련 Command 등록
 */
export function registerHistoryCommands(): void {
	commandRegistry.register("history:undo", () => {
		useEditorStore.temporal.getState().undo()
	})

	commandRegistry.register("history:redo", () => {
		useEditorStore.temporal.getState().redo()
	})
}
