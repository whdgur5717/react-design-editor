import type { NodeLocation, SceneNode } from "@design-editor/core"

import type { Command, EditorReceiver } from "../types"

interface RemovedClipboardNode {
	location: NodeLocation
	node: SceneNode
}

export class CutNodesCommand implements Command {
	private readonly removedNodes: RemovedClipboardNode[]
	private readonly previousSelection: string[]

	constructor(
		private readonly receiver: EditorReceiver,
		private readonly sourcePageId: string,
		nodeIds: string[],
	) {
		this.previousSelection = receiver.getSelection()
		this.removedNodes = nodeIds.map((nodeId) => {
			const node = receiver.findNode(nodeId, { pageId: sourcePageId })
			if (!node) {
				throw new Error(`Node not found in page ${sourcePageId}: ${nodeId}`)
			}

			const location = receiver.findNodeLocation(nodeId, { pageId: sourcePageId })
			if (!location) {
				throw new Error(`Node location not found in page ${sourcePageId}: ${nodeId}`)
			}

			return {
				location,
				node: structuredClone(node),
			}
		})
	}

	execute() {
		for (const { node } of this.removedNodes) {
			this.receiver.removeNode(node.id, { pageId: this.sourcePageId })
		}

		this.receiver.setSelection([])
	}

	undo() {
		const nodesByRestoreOrder = [...this.removedNodes].sort((a, b) => {
			if (a.location.parentId === b.location.parentId) {
				return a.location.index - b.location.index
			}
			return a.location.parentId.localeCompare(b.location.parentId)
		})

		for (const { location, node } of nodesByRestoreOrder) {
			this.receiver.addNode(location.parentId, structuredClone(node), location.index, { pageId: this.sourcePageId })
		}

		this.receiver.setSelection(this.previousSelection)
	}
}
