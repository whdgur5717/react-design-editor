import type { NodeLocation, NodeSnapshot, PageSnapshot, Position, Size, TextChangePayload } from "@open-editor-sdk/core"
import type { CSSProperties } from "react"

import { DuplicateNodeCommand } from "../commands/node/DuplicateNodeCommand"
import { MoveNodeCommand } from "../commands/node/MoveNodeCommand"
import { RemoveNodeCommand } from "../commands/node/RemoveNodeCommand"
import { ReorderNodeCommand } from "../commands/node/ReorderNodeCommand"
import { ResizeNodeCommand } from "../commands/node/ResizeNodeCommand"
import { UpdateNodeCommand } from "../commands/node/UpdateNodeCommand"
import { UpdateStyleCommand } from "../commands/node/UpdateStyleCommand"
import type { DocumentMutationRepository, DocumentReadRepository } from "./EditorStateRepository"
import type { HistoryService } from "./HistoryService"

export class DocumentService {
	constructor(
		private readonly repository: DocumentReadRepository,
		private readonly receiver: DocumentReadRepository & DocumentMutationRepository,
		private readonly history: HistoryService,
	) {}

	findNode(id: string): NodeSnapshot | null {
		return this.repository.findNode(id)
	}

	findNodeLocation(id: string): NodeLocation | null {
		return this.repository.findNodeLocation(id)
	}

	getCurrentPageId() {
		return this.repository.getCurrentPageId()
	}

	getCurrentPage(): PageSnapshot | null {
		return this.repository.getCurrentPage()
	}

	findPage(pageId: string): PageSnapshot | null {
		return this.repository.findPage(pageId)
	}

	deleteSelectedNodes() {
		const selection = this.receiver.getSelection()
		if (selection.length === 0) return

		const topLevelIds = filterToTopLevelSelectedIds(selection, this.receiver)
		if (topLevelIds.length > 1) this.history.beginTransaction()
		for (const id of topLevelIds) {
			this.history.execute(new RemoveNodeCommand(this.receiver, id))
		}
		if (topLevelIds.length > 1) this.history.commitTransaction()

		this.receiver.setSelection([])
	}

	duplicateSelectedNodes() {
		const selection = this.receiver.getSelection()
		if (selection.length === 0) return

		if (selection.length > 1) this.history.beginTransaction()
		for (const id of selection) {
			this.history.execute(new DuplicateNodeCommand(this.receiver, id))
		}
		if (selection.length > 1) this.history.commitTransaction()
	}

	applyTextChangeFromCanvas(nodeId: string, content: unknown) {
		const node = this.receiver.findNode(nodeId)
		if (node?.type !== "text") return

		this.history.execute(
			new UpdateNodeCommand(this.receiver, nodeId, {
				content: content as TextChangePayload["content"],
			}),
		)
	}

	updateStyleProperty(nodeId: string, key: keyof CSSProperties, value: CSSProperties[keyof CSSProperties]) {
		this.history.execute(new UpdateStyleCommand(this.receiver, nodeId, { [key]: value }, `style-${nodeId}-${key}`))
	}

	updatePosition(nodeId: string, position: Position) {
		const node = this.receiver.findNode(nodeId)
		if (!node) return

		this.history.execute(new MoveNodeCommand(this.receiver, nodeId, { x: node.x ?? 0, y: node.y ?? 0 }, position))
	}

	resizeNode(nodeId: string, from: Size, to: Size, mergeKey: string) {
		this.history.execute(new ResizeNodeCommand(this.receiver, nodeId, from, to, mergeKey))
	}

	reorderNode(parentId: string, fromIndex: number, toIndex: number) {
		this.history.execute(new ReorderNodeCommand(this.receiver, parentId, fromIndex, toIndex))
	}

	toggleVisibility(nodeId: string) {
		const node = this.repository.findNode(nodeId)
		if (!node) return
		this.history.execute(new UpdateNodeCommand(this.receiver, nodeId, { visible: node.visible !== false ? false : true }))
	}

	toggleLocked(nodeId: string) {
		const node = this.repository.findNode(nodeId)
		if (!node) return
		this.history.execute(new UpdateNodeCommand(this.receiver, nodeId, { locked: node.locked !== true }))
	}
}

function filterToTopLevelSelectedIds(selection: string[], repository: DocumentReadRepository) {
	return selection.filter((id) => {
		let location = repository.findNodeLocation(id)
		while (location) {
			if (selection.includes(location.parentId)) return false
			location = repository.findNodeLocation(location.parentId)
		}
		return true
	})
}
