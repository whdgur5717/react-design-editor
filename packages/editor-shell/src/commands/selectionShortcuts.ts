import type { SceneNode } from "@design-editor/core"

import type { EditorService } from "../services/EditorService"

function collectAllNodeIds(nodes: SceneNode[]) {
	const ids: string[] = []
	for (const node of nodes) {
		ids.push(node.id)
		if ("children" in node && Array.isArray(node.children)) {
			ids.push(...collectAllNodeIds(node.children))
		}
	}
	return ids
}

export function registerSelectionShortcuts(editor: EditorService) {
	editor.shortcutRegistry.register("selection:clear", () => {
		editor.receiver.setSelection([])
	})

	editor.shortcutRegistry.register("selection:all", () => {
		const page = editor.receiver.getCurrentPage()
		if (!page) return

		const allIds = collectAllNodeIds(page.children)
		editor.receiver.setSelection(allIds)
	})
}
