import type { NodeLocation } from "@design-editor/core"

import { CutNodesCommand } from "../commands/clipboard/CutNodesCommand"
import { PasteNodesCommand } from "../commands/clipboard/PasteNodesCommand"
import type { CommandHistory } from "../commands/CommandHistory"
import type { EditorReceiver } from "../commands/types"
import { type ClipboardEntry, type ClipboardPayload, filterToTopLevelInPage, sortClipboardEntries } from "./clipboard"

export class ClipboardRuntime {
	private payload: ClipboardPayload | null = null

	constructor(
		private readonly receiver: EditorReceiver,
		private readonly history: CommandHistory,
	) {}

	copy() {
		const currentPageId = this.receiver.getCurrentPageId()
		const selection = this.receiver.getSelection()
		if (selection.length === 0) return

		const topLevelIds = filterToTopLevelInPage(currentPageId, selection, this.receiver)
		const entries: ClipboardEntry[] = []

		for (const id of topLevelIds) {
			const node = this.receiver.findNode(id, { pageId: currentPageId })
			const location = this.receiver.findNodeLocation(id, { pageId: currentPageId })
			if (!node || !location) continue

			entries.push({
				parentId: location.parentId,
				index: location.index,
				node: structuredClone(node),
			})
		}

		if (entries.length === 0) return

		this.payload = {
			version: 1,
			originPageId: currentPageId,
			entries: sortClipboardEntries(entries),
			pasteCount: 0,
		}
	}

	cut() {
		this.copy()
		if (!this.payload || this.payload.entries.length === 0) return

		const currentPageId = this.receiver.getCurrentPageId()
		const nodeIds = this.payload.entries.map((entry) => entry.node.id)
		this.history.execute(new CutNodesCommand(this.receiver, currentPageId, nodeIds))
	}

	paste() {
		if (!this.payload || this.payload.entries.length === 0) return

		const currentPageId = this.receiver.getCurrentPageId()
		const pasteTarget = this.resolvePasteTarget(currentPageId)
		const offset = 20 * (this.payload.pasteCount + 1)
		const snapshots = this.payload.entries.map((entry) => entry.node)

		this.history.execute(
			new PasteNodesCommand(
				this.receiver,
				currentPageId,
				pasteTarget.parentId,
				snapshots,
				offset,
				offset,
				pasteTarget.index,
			),
		)

		this.payload = {
			...this.payload,
			pasteCount: this.payload.pasteCount + 1,
		}
	}

	private resolvePasteTarget(currentPageId: string): NodeLocation {
		const selection = this.receiver.getSelection()
		if (selection.length === 0) {
			return { parentId: currentPageId, index: Number.MAX_SAFE_INTEGER }
		}

		const topLevelIds = filterToTopLevelInPage(currentPageId, selection, this.receiver)
		const locations = topLevelIds
			.map((id) => this.receiver.findNodeLocation(id, { pageId: currentPageId }))
			.filter((location): location is NodeLocation => location !== null)

		if (locations.length === 0) {
			return { parentId: currentPageId, index: Number.MAX_SAFE_INTEGER }
		}

		const parentId = locations[0].parentId
		if (locations.some((location) => location.parentId !== parentId)) {
			return { parentId: currentPageId, index: Number.MAX_SAFE_INTEGER }
		}

		const maxIndex = Math.max(...locations.map((location) => location.index))
		return { parentId, index: maxIndex + 1 }
	}
}
