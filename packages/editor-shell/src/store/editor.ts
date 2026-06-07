import type { DocumentNode, EditorModel, NodeLocation, NodePageContext, PageNode, SceneNode } from "@design-editor/core"
import { createStore } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import type { StoreApi } from "zustand/vanilla"

export function findNode(parent: PageNode | SceneNode, id: string): SceneNode | null {
	if ("children" in parent && Array.isArray(parent.children)) {
		for (const child of parent.children) {
			if (child.id === id) return child
			const found = findNode(child, id)
			if (found) return found
		}
	}
	return null
}

export function findParent(parent: PageNode | SceneNode, id: string): PageNode | SceneNode | null {
	if ("children" in parent && Array.isArray(parent.children)) {
		for (const child of parent.children) {
			if (child.id === id) return parent
			const found = findParent(child, id)
			if (found) return found
		}
	}
	return null
}

export function getChildrenOf(node: PageNode | SceneNode): SceneNode[] | null {
	if ("children" in node && Array.isArray(node.children)) return node.children
	return null
}

export function findPage(document: DocumentNode, pageId: string) {
	return document.children.find((page) => page.id === pageId) ?? null
}

export function resolvePage(document: DocumentNode, currentPageId: string, context?: NodePageContext) {
	return findPage(document, context?.pageId ?? currentPageId)
}

function findLocationInTree(nodes: SceneNode[], targetId: string): NodeLocation | null {
	for (const node of nodes) {
		if (Array.isArray(node.children)) {
			const index = node.children.findIndex((child) => child.id === targetId)
			if (index !== -1) {
				return { parentId: node.id, index }
			}

			const found = findLocationInTree(node.children, targetId)
			if (found) return found
		}
	}

	return null
}

export function findNodeLocationInPage(page: PageNode, id: string): NodeLocation | null {
	const pageChildIndex = page.children.findIndex((child) => child.id === id)
	if (pageChildIndex !== -1) {
		return { parentId: page.id, index: pageChildIndex }
	}

	return findLocationInTree(page.children, id)
}

export function collectNodeIds(node: SceneNode): string[] {
	const ids = [node.id]
	if (Array.isArray(node.children)) {
		for (const child of node.children) {
			ids.push(...collectNodeIds(child))
		}
	}
	return ids
}

export function cloneNodeWithNewIds(node: SceneNode): SceneNode {
	const prefix = node.type === "element" ? node.tag.toLowerCase() : node.type
	const newId = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

	return {
		...node,
		id: newId,
		...(Array.isArray(node.children) && {
			children: node.children.map(cloneNodeWithNewIds),
		}),
	}
}

export function isAncestorOf(page: PageNode, sourceId: string, targetId: string) {
	const sourceNode = findNode(page, sourceId)
	if (!sourceNode) return false
	return hasDescendant(sourceNode, targetId)
}

function hasDescendant(node: SceneNode, targetId: string): boolean {
	if (node.id === targetId) return true
	if ("children" in node && Array.isArray(node.children)) {
		for (const child of node.children) {
			if (hasDescendant(child, targetId)) return true
		}
	}
	return false
}

const initialDocument: DocumentNode = {
	id: "doc-root",
	children: [
		{
			id: "page-1",
			name: "Page 1",
			children: [
				{
					id: "root",
					type: "element",
					tag: "div",
					x: 0,
					y: 0,
					style: {
						width: 400,
						height: 300,
						backgroundColor: "#ffffff",
						padding: 16,
					},
					children: [
						{
							id: "text-1",
							type: "text",
							content: {
								type: "doc",
								content: [
									{
										type: "paragraph",
										content: [{ type: "text", text: "Hello, World!" }],
									},
								],
							},
							style: {
								fontSize: 24,
								fontWeight: "bold",
								color: "#1a1a1a",
							},
						},
					],
				},
			],
		},
	],
	meta: {
		name: "Untitled",
		createdAt: new Date().toISOString(),
	},
}

export interface CreateEditorStoreOptions {
	document?: DocumentNode
	currentPageId?: string
}

export type EditorStoreApi = StoreApi<EditorModel>

export function createInitialEditorModel(options: CreateEditorStoreOptions = {}): EditorModel {
	const document = structuredClone(options.document ?? initialDocument)
	return {
		document,
		currentPageId: options.currentPageId ?? "page-1",
		selection: [],
		hoveredId: null,
		activeTool: "select",
		zoom: 1,
		panX: 0,
		panY: 0,
		dragPreview: null,
		nodeRectsCache: {},
	}
}

export function createEditorStore(options: CreateEditorStoreOptions = {}): EditorStoreApi {
	return createStore<EditorModel>()(subscribeWithSelector(() => createInitialEditorModel(options)))
}
