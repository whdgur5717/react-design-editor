import type { SceneNode } from "@open-editor-sdk/core"

import { applyPasteOffset, cloneSceneNodeWithNewIds } from "../../services/clipboard"
import type { Command, DocumentCommandReceiver } from "../types"

export class PasteNodesCommand implements Command {
	private createdNodes: SceneNode[] | null = null
	private readonly previousSelection: string[]

	constructor(
		private readonly receiver: DocumentCommandReceiver,
		private readonly targetPageId: string,
		private readonly targetParentId: string,
		private readonly nodesSnapshot: SceneNode[],
		private readonly offsetDx: number,
		private readonly offsetDy: number,
		private readonly insertIndex?: number,
	) {
		this.previousSelection = receiver.getSelection()
	}

	execute() {
		if (!this.createdNodes) {
			this.createdNodes = this.nodesSnapshot.map((node) => cloneSceneNodeWithNewIds(node))
			applyPasteOffset(this.createdNodes, this.offsetDx, this.offsetDy)
		}

		for (const [index, node] of this.createdNodes.entries()) {
			const targetIndex = this.insertIndex === undefined ? undefined : this.insertIndex + index
			this.receiver.addNode(this.targetParentId, structuredClone(node), targetIndex, { pageId: this.targetPageId })
		}

		this.receiver.setSelection(this.createdNodes.map((node) => node.id))
	}

	undo() {
		if (!this.createdNodes) return

		for (const node of this.createdNodes) {
			this.receiver.removeNode(node.id, { pageId: this.targetPageId })
		}

		this.receiver.setSelection(this.previousSelection)
	}
}
