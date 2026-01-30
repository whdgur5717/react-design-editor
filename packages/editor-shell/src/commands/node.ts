import { useEditorStore } from "../store/editor"
import { commandRegistry } from "./CommandRegistry"

/**
 * Node 관련 Command 등록
 */
export function registerNodeCommands(): void {
	commandRegistry.register("node:delete", () => {
		const selection = useEditorStore.getState().selection
		for (const id of selection) {
			useEditorStore.getState().removeNode(id)
		}
		useEditorStore.getState().setSelection([])
	})

	commandRegistry.register("node:duplicate", () => {
		const selection = useEditorStore.getState().selection
		for (const id of selection) {
			useEditorStore.getState().duplicateNode(id)
		}
	})
}
