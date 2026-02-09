import type {
	ComponentDefinition,
	DocumentNode,
	EditorStore,
	EditorTool,
	ElementNode,
	InstanceNode,
	PageNode,
	Position,
	SceneNode,
	Size,
} from "@design-editor/core"
import { current } from "immer"
import type { CSSProperties } from "react"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

// ── Read-only 트리 헬퍼 ──

function findNode(parent: PageNode | SceneNode, id: string): SceneNode | null {
	if ("children" in parent && Array.isArray(parent.children)) {
		for (const child of parent.children) {
			if (child.id === id) return child
			const found = findNode(child, id)
			if (found) return found
		}
	}
	return null
}

function findParent(parent: PageNode | SceneNode, id: string): PageNode | SceneNode | null {
	if ("children" in parent && Array.isArray(parent.children)) {
		for (const child of parent.children) {
			if (child.id === id) return parent
			const found = findParent(child, id)
			if (found) return found
		}
	}
	return null
}

function getChildrenOf(node: PageNode | SceneNode): SceneNode[] | null {
	if ("children" in node && Array.isArray(node.children)) return node.children
	return null
}

function cloneNodeWithNewIds(node: SceneNode): SceneNode {
	const prefix = node.type === "element" ? node.tag.toLowerCase() : "instance"
	const newId = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

	return {
		...node,
		id: newId,
		...(node.type === "element" &&
			Array.isArray(node.children) && {
				children: node.children.map(cloneNodeWithNewIds),
			}),
	}
}

function isAncestorOf(page: PageNode, sourceId: string, targetId: string) {
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

/**
 * 초기 문서 상태
 */
const initialPageId = "page-1"

const initialDocument: DocumentNode = {
	id: "doc-root",
	children: [
		{
			id: initialPageId,
			name: "Page 1",
			children: [
				{
					id: "root",
					type: "element",
					tag: "div",
					style: {
						position: "absolute",
						left: 0,
						top: 0,
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
								position: "absolute",
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

/**
 * 에디터 스토어
 */
export const useEditorStore = create<EditorStore>()(
	immer((set, get) => ({
		// 초기 상태
		document: initialDocument,
		currentPageId: initialPageId,
		components: [],
		selection: [],
		hoveredId: null,
		activeTool: "select",
		zoom: 1,

		// 노드 액션
		updateNode(id: string, updates: Partial<SceneNode>) {
			set((state) => {
				const page = state.document.children.find((p) => p.id === state.currentPageId)
				if (!page) return

				const node = findNode(page, id)
				if (!node) return

				Object.assign(node, updates)
			})
		},

		addNode(parentId: string, node: SceneNode, index?: number) {
			set((state) => {
				const page = state.document.children.find((p) => p.id === state.currentPageId)
				if (!page) return

				const parent = parentId === page.id ? page : findNode(page, parentId)
				if (!parent) return

				const children = getChildrenOf(parent)
				if (!children) return

				if (index !== undefined) children.splice(index, 0, node)
				else children.push(node)
			})
		},

		removeNode(id: string) {
			set((state) => {
				const page = state.document.children.find((p) => p.id === state.currentPageId)
				if (!page) return

				const parent = findParent(page, id)
				if (!parent) return

				const children = getChildrenOf(parent)
				if (!children) return

				const idx = children.findIndex((c) => c.id === id)
				if (idx !== -1) children.splice(idx, 1)

				state.selection = state.selection.filter((s) => s !== id)
			})
		},

		moveNode(id: string, position: Position) {
			set((state) => {
				const page = state.document.children.find((p) => p.id === state.currentPageId)
				if (!page) return

				const node = findNode(page, id)
				if (!node) return

				node.style = {
					...node.style,
					position: "absolute",
					left: position.x,
					top: position.y,
				}
			})
		},

		resizeNode(id: string, size: Size) {
			set((state) => {
				const page = state.document.children.find((p) => p.id === state.currentPageId)
				if (!page) return

				const node = findNode(page, id)
				if (!node) return

				node.style = {
					...node.style,
					width: size.width,
					height: size.height,
				}
			})
		},

		setSelection(ids: string[]) {
			set({ selection: ids })
		},

		toggleSelection(id: string) {
			set((state) => {
				const idx = state.selection.indexOf(id)
				if (idx !== -1) state.selection.splice(idx, 1)
				else state.selection.push(id)
			})
		},

		setHoveredId(id: string | null) {
			set({ hoveredId: id })
		},

		setActiveTool(tool: EditorTool) {
			set({ activeTool: tool })
		},

		setZoom(zoom: number) {
			set({ zoom: Math.max(0.1, Math.min(4, zoom)) })
		},

		reorderNode(parentId: string, fromIndex: number, toIndex: number) {
			set((state) => {
				const page = state.document.children.find((p) => p.id === state.currentPageId)
				if (!page) return

				const parent = parentId === page.id ? page : findNode(page, parentId)
				if (!parent) return

				const children = getChildrenOf(parent)
				if (!children) return

				const [removed] = children.splice(fromIndex, 1)
				children.splice(toIndex, 0, removed)
			})
		},

		dropNode(sourceId: string, targetId: string, delta: { x: number; y: number }) {
			const page = get().document.children.find((p) => p.id === get().currentPageId)
			if (!page) return

			const currentParent = findParent(page, sourceId)
			if (!currentParent) return

			if (targetId === currentParent.id) {
				const node = findNode(page, sourceId)
				if (!node) return

				const currentLeft = typeof node.style?.left === "number" ? node.style.left : 0
				const currentTop = typeof node.style?.top === "number" ? node.style.top : 0

				get().moveNode(sourceId, {
					x: currentLeft + delta.x,
					y: currentTop + delta.y,
				})
			} else {
				get().reparentNode(sourceId, targetId)
			}
		},

		reparentNode(sourceId: string, newParentId: string) {
			set((state) => {
				const page = state.document.children.find((p) => p.id === state.currentPageId)
				if (!page) return

				const sourceNode = findNode(page, sourceId)
				if (!sourceNode) return
				if (sourceId === newParentId) return
				if (isAncestorOf(page, sourceId, newParentId)) return

				if (newParentId !== page.id) {
					const target = findNode(page, newParentId)
					if (!target || target.type === "instance" || target.type === "text") return
				}

				// snapshot before mutation (current() returns frozen object)
				const snapshot = current(sourceNode)
				const reparentedNode =
					newParentId === page.id
						? snapshot
						: {
								...snapshot,
								style: {
									...snapshot.style,
									position: undefined,
									left: undefined,
									top: undefined,
								},
							}

				// remove from old parent
				const oldParent = findParent(page, sourceId)
				const oldChildren = oldParent ? getChildrenOf(oldParent) : null
				if (!oldChildren) return

				const idx = oldChildren.findIndex((c) => c.id === sourceId)
				oldChildren.splice(idx, 1)

				// add to new parent
				const newParent = newParentId === page.id ? page : findNode(page, newParentId)
				const newChildren = newParent ? getChildrenOf(newParent) : null
				if (!newChildren) return

				newChildren.push(reparentedNode)

				state.selection = [sourceId]
			})
		},

		toggleVisibility(id: string) {
			set((state) => {
				const page = state.document.children.find((p) => p.id === state.currentPageId)
				if (!page) return

				const node = findNode(page, id)
				if (!node) return

				node.visible = node.visible !== false ? false : true
			})
		},

		toggleLocked(id: string) {
			set((state) => {
				const page = state.document.children.find((p) => p.id === state.currentPageId)
				if (!page) return

				const node = findNode(page, id)
				if (!node) return

				node.locked = node.locked !== true
			})
		},

		duplicateNode(id: string): string | null {
			const state = get()
			const page = state.document.children.find((p) => p.id === state.currentPageId)
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

			if (cloned.style) {
				const left = (cloned.style.left as number) ?? 0
				const top = (cloned.style.top as number) ?? 0
				cloned.style = { ...cloned.style, left: left + 20, top: top + 20 }
			}

			state.addNode(parent.id, cloned, index + 1)
			state.setSelection([cloned.id])
			return cloned.id
		},

		createComponent(nodeId: string, name: string): string | null {
			const state = get()
			const page = state.document.children.find((p) => p.id === state.currentPageId)
			if (!page) return null

			const node = findNode(page, nodeId)
			if (!node || node.type === "instance") return null

			const componentId = `comp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

			const componentDef: ComponentDefinition = {
				id: componentId,
				name,
				root: cloneNodeWithNewIds(node) as ElementNode,
				createdAt: new Date().toISOString(),
			}

			const instance: InstanceNode = {
				id: node.id,
				type: "instance",
				componentId,
				style: node.style,
			}

			set((s) => {
				const p = s.document.children.find((pg) => pg.id === s.currentPageId)
				if (!p) return

				const target = findNode(p, nodeId)
				if (!target) return

				Object.assign(target, instance)
				s.components.push(componentDef)
			})

			return componentId
		},

		createInstance(componentId: string, parentId: string) {
			const state = get()
			const component = state.components.find((c) => c.id === componentId)
			if (!component) return null

			const instanceId = `inst-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

			const instance: InstanceNode = {
				id: instanceId,
				type: "instance",
				componentId,
				style: {
					...component.root.style,
					position: "absolute",
					left: 100,
					top: 100,
				},
			}

			state.addNode(parentId, instance)
			state.setSelection([instanceId])

			return instanceId
		},

		updateComponent(componentId: string, updates: Partial<ElementNode>) {
			set((state) => {
				const comp = state.components.find((c) => c.id === componentId)
				if (!comp) return
				Object.assign(comp.root, updates)
			})
		},

		deleteComponent(componentId: string) {
			set((state) => {
				const idx = state.components.findIndex((c) => c.id === componentId)
				if (idx !== -1) state.components.splice(idx, 1)
			})
		},

		setInstanceOverride(
			instanceId: string,
			targetNodeId: string,
			overrides: { props?: Record<string, unknown>; style?: CSSProperties; children?: string },
		) {
			set((state) => {
				const page = state.document.children.find((p) => p.id === state.currentPageId)
				if (!page) return

				const node = findNode(page, instanceId)
				if (!node || node.type !== "instance") return

				if (!node.overrides) node.overrides = {}
				node.overrides[targetNodeId] = {
					...node.overrides[targetNodeId],
					...overrides,
				}
			})
		},

		resetInstanceOverrides(instanceId: string) {
			set((state) => {
				const page = state.document.children.find((p) => p.id === state.currentPageId)
				if (!page) return

				const node = findNode(page, instanceId)
				if (!node || node.type !== "instance") return

				node.overrides = undefined
			})
		},

		// 페이지 액션
		setCurrentPage(pageId: string) {
			set((state) => {
				if (!state.document.children.some((p) => p.id === pageId)) return
				state.currentPageId = pageId
				state.selection = []
			})
		},

		addPage(name: string): string {
			const pageId = `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

			set((state) => {
				state.document.children.push({ id: pageId, name, children: [] })
				state.currentPageId = pageId
				state.selection = []
			})

			return pageId
		},

		removePage(pageId: string) {
			set((state) => {
				if (state.document.children.length <= 1) return

				const idx = state.document.children.findIndex((p) => p.id === pageId)
				if (idx === -1) return

				state.document.children.splice(idx, 1)

				if (state.currentPageId === pageId) {
					state.currentPageId = state.document.children[0].id
					state.selection = []
				}
			})
		},

		renamePage(pageId: string, name: string) {
			set((state) => {
				const page = state.document.children.find((p) => p.id === pageId)
				if (page) page.name = name
			})
		},

		// 유틸리티 메서드
		findNode(id: string): SceneNode | null {
			const page = get().document.children.find((p) => p.id === get().currentPageId)
			if (!page) return null
			return findNode(page, id)
		},
	})),
)
