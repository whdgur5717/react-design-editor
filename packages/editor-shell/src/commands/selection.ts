import { useEditorStore } from "../store/editor"
import { commandRegistry } from "./CommandRegistry"

/**
 * Selection 관련 Command 등록
 */
export function registerSelectionCommands(): void {
	commandRegistry.register("selection:clear", () => {
		useEditorStore.getState().setSelection([])
	})

	// TODO: selection:all 구현 (현재 페이지의 모든 노드 선택)
}
