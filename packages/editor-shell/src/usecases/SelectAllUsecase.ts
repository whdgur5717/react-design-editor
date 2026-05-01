import type { SceneNode } from "@design-editor/core"

import type { EditorReceiver } from "../commands/types"

export class SelectAllUsecase {
	constructor(private readonly receiver: EditorReceiver) {}

	run() {
		const page = this.receiver.getCurrentPage()
		if (!page) return
		this.receiver.setSelection(collectAllNodeIds(page.children))
	}
}

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
