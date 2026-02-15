import type { EditorService } from "../services/EditorService"
import { DuplicateNodeCommand, RemoveNodeCommand } from "./node"
import type { EditorReceiver } from "./types"

/**
 * 조상이 이미 선택된 노드를 제외하여 최상위 노드만 반환
 */
function filterToTopLevel(selection: string[], recv: EditorReceiver) {
	return selection.filter((id) => {
		let location = recv.findNodeLocation(id)
		while (location) {
			if (selection.includes(location.parentId)) return false
			location = recv.findNodeLocation(location.parentId)
		}
		return true
	})
}

export function registerNodeShortcuts(editor: EditorService) {
	editor.shortcutRegistry.register("node:delete", () => {
		const selection = editor.receiver.getSelection()
		if (selection.length === 0) return

		const topLevelIds = filterToTopLevel(selection, editor.receiver)

		if (topLevelIds.length > 1) {
			editor.commandHistory.beginTransaction()
		}

		for (const id of topLevelIds) {
			const command = new RemoveNodeCommand(editor.receiver, id)
			editor.commandHistory.execute(command)
		}

		if (topLevelIds.length > 1) {
			editor.commandHistory.commitTransaction()
		}

		editor.receiver.setSelection([])
	})

	editor.shortcutRegistry.register("node:duplicate", () => {
		const selection = editor.receiver.getSelection()
		if (selection.length === 0) return

		if (selection.length > 1) {
			editor.commandHistory.beginTransaction()
		}

		for (const id of selection) {
			const command = new DuplicateNodeCommand(editor.receiver, id)
			editor.commandHistory.execute(command)
		}

		if (selection.length > 1) {
			editor.commandHistory.commitTransaction()
		}
	})
}
