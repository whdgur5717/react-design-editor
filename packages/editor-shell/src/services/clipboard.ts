import type { SceneNode } from "@open-editor-sdk/core"

import type { DocumentCommandReceiver } from "../commands/types"

export interface ClipboardEntry {
	parentId: string
	index: number
	node: SceneNode
}

export interface ClipboardPayload {
	version: 1
	originPageId: string
	entries: ClipboardEntry[]
	pasteCount: number
}

export function filterToTopLevelInPage(pageId: string, selection: string[], receiver: DocumentCommandReceiver) {
	return selection.filter((id) => {
		let location = receiver.findNodeLocation(id, { pageId })
		while (location) {
			if (selection.includes(location.parentId)) return false
			location = receiver.findNodeLocation(location.parentId, { pageId })
		}
		return true
	})
}

export function sortClipboardEntries(entries: ClipboardEntry[]) {
	return [...entries].sort((a, b) => {
		if (a.parentId === b.parentId) return a.index - b.index
		return a.parentId.localeCompare(b.parentId)
	})
}

export function cloneSceneNodeWithNewIds(node: SceneNode): SceneNode {
	const cloned = structuredClone(node)
	replaceNodeIds(cloned)
	return cloned
}

export function applyPasteOffset(nodes: SceneNode[], dx: number, dy: number) {
	for (const node of nodes) {
		node.x = (node.x ?? 0) + dx
		node.y = (node.y ?? 0) + dy
	}
}

function replaceNodeIds(node: SceneNode) {
	node.id = createNodeId(node)
	if (Array.isArray(node.children)) {
		for (const child of node.children) {
			replaceNodeIds(child)
		}
	}
}

function createNodeId(node: SceneNode) {
	const prefix = node.type === "element" ? node.tag.toLowerCase() : node.type
	return `${prefix}-${crypto.randomUUID()}`
}
