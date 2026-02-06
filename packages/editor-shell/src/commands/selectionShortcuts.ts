import type { SceneNode } from "@design-editor/core"

import { receiver } from "./index"
import { shortcutRegistry } from "./ShortcutRegistry"

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

export function registerSelectionShortcuts() {
	shortcutRegistry.register("selection:clear", () => {
		receiver.setSelection([])
	})

	shortcutRegistry.register("selection:all", () => {
		const page = receiver.getCurrentPage()
		if (!page) return

		const allIds = collectAllNodeIds(page.children)
		receiver.setSelection(allIds)
	})
}
