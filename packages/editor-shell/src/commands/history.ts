import { useHistoryStore } from "../store/history"
import { commandRegistry } from "./CommandRegistry"

/**
 * History 관련 Command 등록
 */
export function registerHistoryCommands(): void {
	commandRegistry.register("history:undo", () => {
		useHistoryStore.getState().undo()
	})

	commandRegistry.register("history:redo", () => {
		useHistoryStore.getState().redo()
	})
}
