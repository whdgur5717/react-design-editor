import type {
	DocumentNode,
	EditorModel,
	EditorTool,
	NodeLocation,
	NodePageContext,
	NodeRect,
	NodeStyle,
	PageNode,
	Position,
	SceneNode,
	Size,
} from "@open-editor-sdk/core"
import { current, produce } from "immer"
import type { CSSProperties } from "react"

import {
	cloneNodeWithNewIds,
	collectNodeIds,
	type EditorStoreApi,
	findNode,
	findNodeLocationInPage,
	findPage,
	findParent,
	getChildrenOf,
	isAncestorOf,
	resolvePage,
} from "../store/editor"

export interface DocumentSessionRepository {
	loadDocument(document: DocumentNode, currentPageId: string): void
	setCurrentPage(pageId: string): void
	resetTransientState(): void
}

export interface DocumentReadRepository {
	findNode(id: string, context?: NodePageContext): SceneNode | null
	findNodeLocation(id: string, context?: NodePageContext): NodeLocation | null
	findPage(pageId: string): PageNode | null
	getCurrentPageId(): string
	getCurrentPage(): PageNode | null
	getSelection(): string[]
}

export interface DocumentMutationRepository {
	updateNode(id: string, updates: Partial<SceneNode>, context?: NodePageContext): void
	addNode(parentId: string, node: SceneNode, index?: number, context?: NodePageContext): void
	removeNode(id: string, context?: NodePageContext): void
	moveNode(id: string, position: Position, context?: NodePageContext): void
	resizeNode(id: string, size: Size, context?: NodePageContext): void
	reorderNode(parentId: string, fromIndex: number, toIndex: number, context?: NodePageContext): void
	reparentNode(sourceId: string, newParentId: string, context?: NodePageContext): void
	toggleVisibility(id: string, context?: NodePageContext): void
	toggleLocked(id: string, context?: NodePageContext): void
	duplicateNode(id: string): string | null
	updateNodeStyle(id: string, styleUpdates: Partial<NodeStyle>): void
	addPage(name: string): string
	removePage(pageId: string): void
	renamePage(pageId: string, name: string): void
	setSelection(ids: string[]): void
}

export interface SelectionRepository {
	getSelection(): string[]
	setSelection(ids: string[]): void
	toggleSelection(id: string): void
	setHoveredId(id: string | null): void
}

export interface ToolStateRepository {
	getActiveTool(): EditorTool
	setActiveTool(tool: EditorTool): void
}

export interface ViewportRepository {
	getZoom(): number
	getPan(): { x: number; y: number }
	setZoom(zoom: number): void
	setPan(panX: number, panY: number): void
}

export interface GeometryRepository {
	getNodeRectsCache(): Record<string, NodeRect>
	setNodeRectsCache(rects: Record<string, NodeRect>): void
	getNodeRenderedRect(nodeId: string): NodeRect | null
}

export interface InteractionRepository {
	getDragPreview(): { nodeId: string; dx: number; dy: number } | null
	setDragPreview(preview: { nodeId: string; dx: number; dy: number } | null): void
}

export class EditorStateRepository
	implements
		DocumentSessionRepository,
		DocumentReadRepository,
		DocumentMutationRepository,
		SelectionRepository,
		ToolStateRepository,
		ViewportRepository,
		GeometryRepository,
		InteractionRepository
{
	constructor(private readonly store: EditorStoreApi) {}

	loadDocument(document: DocumentNode, currentPageId: string) {
		const nextDocument = structuredClone(document)
		this.store.setState({
			document: nextDocument,
			currentPageId,
			selection: [],
			hoveredId: null,
			dragPreview: null,
			zoom: 1,
			panX: 0,
			panY: 0,
			nodeRectsCache: {},
		})
	}

	resetTransientState() {
		this.store.setState({
			selection: [],
			hoveredId: null,
			dragPreview: null,
			nodeRectsCache: {},
		})
	}

	setCurrentPage(pageId: string) {
		const state = this.store.getState()
		if (!state.document.children.some((page) => page.id === pageId)) return
		this.store.setState({
			currentPageId: pageId,
			selection: [],
		})
	}

	updateNode(id: string, updates: Partial<SceneNode>, context?: NodePageContext) {
		this.store.setState(
			produce<EditorModel>((state) => {
				const page = resolvePage(state.document, state.currentPageId, context)
				if (!page) return

				const node = findNode(page, id)
				if (!node) return

				Object.assign(node, updates)
			}),
		)
	}

	addNode(parentId: string, node: SceneNode, index?: number, context?: NodePageContext) {
		this.store.setState(
			produce<EditorModel>((state) => {
				const page = resolvePage(state.document, state.currentPageId, context)
				if (!page) return

				const parent = parentId === page.id ? page : findNode(page, parentId)
				if (!parent) return

				const children = getChildrenOf(parent)
				if (!children) return

				if (index !== undefined) children.splice(index, 0, node)
				else children.push(node)
			}),
		)
	}

	removeNode(id: string, context?: NodePageContext) {
		this.store.setState(
			produce<EditorModel>((state) => {
				const page = resolvePage(state.document, state.currentPageId, context)
				if (!page) return

				const parent = findParent(page, id)
				if (!parent) return

				const children = getChildrenOf(parent)
				if (!children) return

				const idx = children.findIndex((child) => child.id === id)
				if (idx === -1) return

				const removedNode = children[idx]
				const removedIds = collectNodeIds(removedNode)
				children.splice(idx, 1)
				state.selection = state.selection.filter((selectionId) => !removedIds.includes(selectionId))
			}),
		)
	}

	moveNode(id: string, position: Position, context?: NodePageContext) {
		this.store.setState(
			produce<EditorModel>((state) => {
				const page = resolvePage(state.document, state.currentPageId, context)
				if (!page) return

				const node = findNode(page, id)
				if (!node) return

				node.x = position.x
				node.y = position.y
			}),
		)
	}

	resizeNode(id: string, size: Size, context?: NodePageContext) {
		this.store.setState(
			produce<EditorModel>((state) => {
				const page = resolvePage(state.document, state.currentPageId, context)
				if (!page) return

				const node = findNode(page, id)
				if (!node) return

				node.style = {
					...node.style,
					width: size.width,
					height: size.height,
				}
			}),
		)
	}

	reorderNode(parentId: string, fromIndex: number, toIndex: number, context?: NodePageContext) {
		this.store.setState(
			produce<EditorModel>((state) => {
				const page = resolvePage(state.document, state.currentPageId, context)
				if (!page) return

				const parent = parentId === page.id ? page : findNode(page, parentId)
				if (!parent) return

				const children = getChildrenOf(parent)
				if (!children) return

				const [removed] = children.splice(fromIndex, 1)
				children.splice(toIndex, 0, removed)
			}),
		)
	}

	dropNode(sourceId: string, targetId: string, delta: { x: number; y: number }) {
		const page = this.getCurrentPage()
		if (!page) return

		const currentParent = findParent(page, sourceId)
		if (!currentParent) return

		if (targetId === currentParent.id) {
			const node = findNode(page, sourceId)
			if (!node) return

			this.moveNode(sourceId, {
				x: (node.x ?? 0) + delta.x,
				y: (node.y ?? 0) + delta.y,
			})
		} else {
			this.reparentNode(sourceId, targetId)
		}
	}

	reparentNode(sourceId: string, newParentId: string, context?: NodePageContext) {
		this.store.setState(
			produce<EditorModel>((state) => {
				const page = resolvePage(state.document, state.currentPageId, context)
				if (!page) return

				const sourceNode = findNode(page, sourceId)
				if (!sourceNode) return
				if (sourceId === newParentId) return
				if (isAncestorOf(page, sourceId, newParentId)) return

				if (newParentId !== page.id) {
					const target = findNode(page, newParentId)
					if (!target || target.type === "text") return
				}

				const snapshot = current(sourceNode)
				const oldParent = findParent(page, sourceId)
				const oldChildren = oldParent ? getChildrenOf(oldParent) : null
				if (!oldChildren) return

				const idx = oldChildren.findIndex((child) => child.id === sourceId)
				oldChildren.splice(idx, 1)

				const newParent = newParentId === page.id ? page : findNode(page, newParentId)
				const newChildren = newParent ? getChildrenOf(newParent) : null
				if (!newChildren) return
				newChildren.push(snapshot)

				state.selection = [sourceId]
			}),
		)
	}

	toggleVisibility(id: string, context?: NodePageContext) {
		this.store.setState(
			produce<EditorModel>((state) => {
				const page = resolvePage(state.document, state.currentPageId, context)
				if (!page) return

				const node = findNode(page, id)
				if (!node) return

				node.visible = node.visible !== false ? false : true
			}),
		)
	}

	toggleLocked(id: string, context?: NodePageContext) {
		this.store.setState(
			produce<EditorModel>((state) => {
				const page = resolvePage(state.document, state.currentPageId, context)
				if (!page) return

				const node = findNode(page, id)
				if (!node) return

				node.locked = node.locked !== true
			}),
		)
	}

	duplicateNode(id: string): string | null {
		const page = this.getCurrentPage()
		if (!page) return null

		const node = findNode(page, id)
		if (!node) return null

		const parent = findParent(page, id)
		if (!parent) return null

		const children = getChildrenOf(parent)
		if (!children) return null

		const index = children.findIndex((child) => child.id === id)
		if (index === -1) return null

		const cloned = cloneNodeWithNewIds(node)
		cloned.x = (cloned.x ?? 0) + 20
		cloned.y = (cloned.y ?? 0) + 20

		this.addNode(parent.id, cloned, index + 1)
		this.setSelection([cloned.id])
		return cloned.id
	}

	addPage(name: string) {
		const pageId = `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
		this.store.setState(
			produce<EditorModel>((state) => {
				state.document.children.push({ id: pageId, name, children: [] })
				state.currentPageId = pageId
				state.selection = []
			}),
		)
		return pageId
	}

	removePage(pageId: string) {
		this.store.setState(
			produce<EditorModel>((state) => {
				if (state.document.children.length <= 1) return

				const idx = state.document.children.findIndex((page) => page.id === pageId)
				if (idx === -1) return

				state.document.children.splice(idx, 1)

				if (state.currentPageId === pageId) {
					state.currentPageId = state.document.children[0].id
					state.selection = []
				}
			}),
		)
	}

	renamePage(pageId: string, name: string) {
		this.store.setState(
			produce<EditorModel>((state) => {
				const page = state.document.children.find((candidate) => candidate.id === pageId)
				if (page) page.name = name
			}),
		)
	}

	updateNodeStyle(id: string, styleUpdates: Partial<NodeStyle>) {
		this.store.setState(
			produce<EditorModel>((state) => {
				const page = findPage(state.document, state.currentPageId)
				if (!page) return
				const node = findNode(page, id)
				if (!node) return
				if (!node.style) node.style = {}
				for (const [key, val] of Object.entries(styleUpdates) as [
					keyof CSSProperties,
					CSSProperties[keyof CSSProperties],
				][]) {
					if (val === undefined) {
						delete (node.style as Record<string, unknown>)[key]
					} else {
						;(node.style as Record<string, unknown>)[key] = val
					}
				}
			}),
		)
	}

	findNode(id: string, context?: NodePageContext): SceneNode | null {
		const state = this.store.getState()
		const page = resolvePage(state.document, state.currentPageId, context)
		if (!page) return null
		return findNode(page, id)
	}

	findNodeLocation(id: string, context?: NodePageContext): NodeLocation | null {
		const state = this.store.getState()
		const page = resolvePage(state.document, state.currentPageId, context)
		if (!page) return null
		return findNodeLocationInPage(page, id)
	}

	findPage(pageId: string) {
		return findPage(this.store.getState().document, pageId)
	}

	getCurrentPageId() {
		return this.store.getState().currentPageId
	}

	getCurrentPage() {
		const state = this.store.getState()
		return findPage(state.document, state.currentPageId)
	}

	getSelection() {
		return this.store.getState().selection
	}

	setSelection(ids: string[]) {
		this.store.setState({ selection: ids })
	}

	toggleSelection(id: string) {
		this.store.setState(
			produce<EditorModel>((state) => {
				const idx = state.selection.indexOf(id)
				if (idx !== -1) state.selection.splice(idx, 1)
				else state.selection.push(id)
			}),
		)
	}

	setHoveredId(id: string | null) {
		this.store.setState({ hoveredId: id })
	}

	getActiveTool() {
		return this.store.getState().activeTool
	}

	setActiveTool(tool: EditorTool) {
		this.store.setState({ activeTool: tool })
	}

	getZoom() {
		return this.store.getState().zoom
	}

	getPan() {
		const { panX, panY } = this.store.getState()
		return { x: panX, y: panY }
	}

	setZoom(zoom: number) {
		this.store.setState({ zoom: Math.max(0.1, Math.min(4, zoom)) })
	}

	setPan(panX: number, panY: number) {
		this.store.setState({ panX, panY })
	}

	getDragPreview() {
		return this.store.getState().dragPreview
	}

	setDragPreview(preview: { nodeId: string; dx: number; dy: number } | null) {
		this.store.setState({ dragPreview: preview })
	}

	getNodeRectsCache() {
		return this.store.getState().nodeRectsCache
	}

	setNodeRectsCache(rects: Record<string, NodeRect>) {
		this.store.setState({ nodeRectsCache: rects })
	}

	getNodeRenderedRect(nodeId: string) {
		return this.store.getState().nodeRectsCache[nodeId] ?? null
	}
}
