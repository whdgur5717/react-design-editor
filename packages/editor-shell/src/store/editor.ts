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
import type { CSSProperties } from "react"
import { temporal } from "zundo"
import { create } from "zustand"

function findNodeInPage(page: PageNode, id: string) {
	for (const node of page.children) {
		const found = findNodeInTree(node, id)
		if (found) return found
	}
	return null
}

function findNodeInTree(node: SceneNode, id: string): SceneNode | null {
	if (node.id === id) return node
	if ("children" in node && Array.isArray(node.children)) {
		for (const child of node.children) {
			const found = findNodeInTree(child, id)
			if (found) return found
		}
	}
	return null
}

/**
 * 노드 트리에서 특정 노드를 업데이트하는 헬퍼 (불변성 유지)
 */
function updateNodeInTree(node: SceneNode, id: string, updates: Partial<SceneNode>): SceneNode {
	if (node.id === id) {
		return { ...node, ...updates } as SceneNode
	}
	if ("children" in node && Array.isArray(node.children)) {
		return {
			...node,
			children: node.children.map((child) => updateNodeInTree(child, id, updates)),
		}
	}
	return node
}

/**
 * 페이지의 children을 업데이트하는 헬퍼
 */
function updatePageChildren(page: PageNode, id: string, updates: Partial<SceneNode>): PageNode {
	return {
		...page,
		children: page.children.map((node) => updateNodeInTree(node, id, updates)),
	}
}

/**
 * 노드 트리에서 특정 노드를 삭제하는 헬퍼 (불변성 유지)
 */
function removeNodeFromTree(node: SceneNode, id: string): SceneNode {
	if ("children" in node && Array.isArray(node.children)) {
		return {
			...node,
			children: node.children.filter((child) => child.id !== id).map((child) => removeNodeFromTree(child, id)),
		}
	}
	return node
}

/**
 * 페이지에서 노드를 삭제하는 헬퍼
 */
function removeNodeFromPage(page: PageNode, id: string) {
	return {
		...page,
		children: page.children.filter((node) => node.id !== id).map((node) => removeNodeFromTree(node, id)),
	}
}

/**
 * 노드의 부모를 찾는 헬퍼 (페이지 또는 SceneNode)
 */
function findParentInPage(page: PageNode, id: string) {
	// 페이지의 직접 자식인지 확인
	if (page.children.some((child) => child.id === id)) {
		return page
	}
	// 트리에서 부모 찾기
	for (const node of page.children) {
		const found = findParentInTree(node, id)
		if (found) return found
	}
	return null
}

function findParentInTree(node: SceneNode, id: string): SceneNode | null {
	if ("children" in node && Array.isArray(node.children)) {
		for (const child of node.children) {
			if (child.id === id) return node
			const found = findParentInTree(child, id)
			if (found) return found
		}
	}
	return null
}

/**
 * SceneNode를 깊은 복사하며 새로운 ID 부여
 */
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

/**
 * 현재 페이지 가져오기
 */
function getCurrentPage(document: DocumentNode, currentPageId: string) {
	return document.children.find((page) => page.id === currentPageId) ?? null
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
						width: 400,
						height: 300,
						backgroundColor: "#ffffff",
						padding: 16,
					},
					children: [
						{
							id: "text-1",
							type: "element",
							tag: "p",
							style: {
								fontSize: 24,
								fontWeight: "bold",
								color: "#1a1a1a",
							},
							children: "Hello, World!",
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
	temporal(
		(set, get) => ({
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
					const pageIndex = state.document.children.findIndex((p) => p.id === state.currentPageId)
					if (pageIndex === -1) return state

					const newPages = [...state.document.children]
					newPages[pageIndex] = updatePageChildren(newPages[pageIndex], id, updates)

					return {
						document: { ...state.document, children: newPages },
					}
				})
			},

			addNode(parentId: string, node: SceneNode, index?: number) {
				set((state) => {
					const page = getCurrentPage(state.document, state.currentPageId)
					if (!page) return state

					// 페이지에 직접 추가하는 경우
					if (parentId === page.id) {
						const newChildren = [...page.children]
						if (index !== undefined) {
							newChildren.splice(index, 0, node)
						} else {
							newChildren.push(node)
						}
						const pageIndex = state.document.children.findIndex((p) => p.id === state.currentPageId)
						const newPages = [...state.document.children]
						newPages[pageIndex] = { ...page, children: newChildren }
						return { document: { ...state.document, children: newPages } }
					}

					// 노드 내부에 추가하는 경우
					const parent = findNodeInPage(page, parentId)
					if (!parent || parent.type === "instance" || !("children" in parent)) return state

					const children = Array.isArray(parent.children) ? [...parent.children] : []
					if (index !== undefined) {
						children.splice(index, 0, node)
					} else {
						children.push(node)
					}

					const pageIndex = state.document.children.findIndex((p) => p.id === state.currentPageId)
					const newPages = [...state.document.children]
					newPages[pageIndex] = updatePageChildren(page, parentId, { children })

					return { document: { ...state.document, children: newPages } }
				})
			},

			removeNode(id: string) {
				set((state) => {
					const pageIndex = state.document.children.findIndex((p) => p.id === state.currentPageId)
					if (pageIndex === -1) return state

					const newPages = [...state.document.children]
					newPages[pageIndex] = removeNodeFromPage(newPages[pageIndex], id)

					return {
						document: { ...state.document, children: newPages },
						selection: state.selection.filter((selectedId) => selectedId !== id),
					}
				})
			},

			moveNode(id: string, position: Position) {
				const page = getCurrentPage(get().document, get().currentPageId)
				if (!page) return

				const node = findNodeInPage(page, id)
				if (!node) return

				get().updateNode(id, {
					style: {
						...node.style,
						position: "absolute",
						left: position.x,
						top: position.y,
					},
				})
			},

			resizeNode(id: string, size: Size) {
				const page = getCurrentPage(get().document, get().currentPageId)
				if (!page) return

				const node = findNodeInPage(page, id)
				if (!node) return

				get().updateNode(id, {
					style: {
						...node.style,
						width: size.width,
						height: size.height,
					},
				})
			},

			setSelection(ids: string[]) {
				set({ selection: ids })
			},

			toggleSelection(id: string) {
				set((state) => {
					const isSelected = state.selection.includes(id)
					if (isSelected) {
						return { selection: state.selection.filter((s) => s !== id) }
					} else {
						return { selection: [...state.selection, id] }
					}
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
					const page = getCurrentPage(state.document, state.currentPageId)
					if (!page) return state

					// 페이지 레벨 reorder
					if (parentId === page.id) {
						const children = [...page.children]
						const [removed] = children.splice(fromIndex, 1)
						children.splice(toIndex, 0, removed)

						const pageIndex = state.document.children.findIndex((p) => p.id === state.currentPageId)
						const newPages = [...state.document.children]
						newPages[pageIndex] = { ...page, children }
						return { document: { ...state.document, children: newPages } }
					}

					const parent = findNodeInPage(page, parentId)
					if (!parent || !("children" in parent) || !Array.isArray(parent.children)) return state

					const children = [...parent.children]
					const [removed] = children.splice(fromIndex, 1)
					children.splice(toIndex, 0, removed)

					const pageIndex = state.document.children.findIndex((p) => p.id === state.currentPageId)
					const newPages = [...state.document.children]
					newPages[pageIndex] = updatePageChildren(page, parentId, { children })

					return { document: { ...state.document, children: newPages } }
				})
			},

			dropNode(sourceId: string, targetId: string, delta: { x: number; y: number }) {
				const page = getCurrentPage(get().document, get().currentPageId)
				if (!page) return

				const currentParent = findParentInPage(page, sourceId)
				if (!currentParent) return

				// 같은 부모 내에서만 위치 이동
				if (targetId !== currentParent.id) return

				const node = findNodeInPage(page, sourceId)
				if (!node) return

				const currentLeft = typeof node.style?.left === "number" ? node.style.left : 0
				const currentTop = typeof node.style?.top === "number" ? node.style.top : 0

				get().moveNode(sourceId, {
					x: currentLeft + delta.x,
					y: currentTop + delta.y,
				})
			},

			toggleVisibility(id: string) {
				const page = getCurrentPage(get().document, get().currentPageId)
				if (!page) return

				const node = findNodeInPage(page, id)
				if (!node) return

				const currentVisible = node.visible !== false
				get().updateNode(id, { visible: !currentVisible })
			},

			toggleLocked(id: string) {
				const page = getCurrentPage(get().document, get().currentPageId)
				if (!page) return

				const node = findNodeInPage(page, id)
				if (!node) return

				const currentLocked = node.locked === true
				get().updateNode(id, { locked: !currentLocked })
			},

			duplicateNode(id: string) {
				const state = get()
				const page = getCurrentPage(state.document, state.currentPageId)
				if (!page) return

				const node = findNodeInPage(page, id)
				if (!node) return

				const parent = findParentInPage(page, id)
				if (!parent) return

				const parentChildren = "children" in parent ? parent.children : []
				if (!Array.isArray(parentChildren)) return

				const index = parentChildren.findIndex((child) => child.id === id)
				if (index === -1) return

				const cloned = cloneNodeWithNewIds(node)

				// 위치 약간 이동
				if (cloned.style) {
					const left = (cloned.style.left as number) ?? 0
					const top = (cloned.style.top as number) ?? 0
					cloned.style = { ...cloned.style, left: left + 20, top: top + 20 }
				}

				state.addNode(parent.id, cloned, index + 1)
				state.setSelection([cloned.id])
			},

			createComponent(nodeId: string, name: string): string | null {
				const state = get()
				const page = getCurrentPage(state.document, state.currentPageId)
				if (!page) return null

				const node = findNodeInPage(page, nodeId)
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
					const pageIndex = s.document.children.findIndex((p) => p.id === s.currentPageId)
					if (pageIndex === -1) return s

					const newPages = [...s.document.children]
					newPages[pageIndex] = updatePageChildren(newPages[pageIndex], nodeId, instance)

					return {
						components: [...s.components, componentDef],
						document: { ...s.document, children: newPages },
					}
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
				set((state) => ({
					components: state.components.map((comp) =>
						comp.id === componentId ? { ...comp, root: { ...comp.root, ...updates } } : comp,
					),
				}))
			},

			deleteComponent(componentId: string) {
				set((state) => ({
					components: state.components.filter((c) => c.id !== componentId),
				}))
			},

			setInstanceOverride(
				instanceId: string,
				targetNodeId: string,
				overrides: { props?: Record<string, unknown>; style?: CSSProperties; children?: string },
			) {
				const page = getCurrentPage(get().document, get().currentPageId)
				if (!page) return

				const node = findNodeInPage(page, instanceId)
				if (!node || node.type !== "instance" || !("overrides" in node)) return

				const currentOverrides = node.overrides ?? {}
				const newOverrides = {
					...currentOverrides,
					[targetNodeId]: {
						...currentOverrides[targetNodeId],
						...overrides,
					},
				}

				get().updateNode(instanceId, { overrides: newOverrides })
			},

			resetInstanceOverrides(instanceId: string) {
				const page = getCurrentPage(get().document, get().currentPageId)
				if (!page) return

				const node = findNodeInPage(page, instanceId)
				if (!node || node.type !== "instance") return

				get().updateNode(instanceId, { overrides: undefined })
			},

			// 페이지 액션
			setCurrentPage(pageId: string) {
				const page = get().document.children.find((p) => p.id === pageId)
				if (page) {
					set({ currentPageId: pageId, selection: [] })
				}
			},

			addPage(name: string): string {
				const pageId = `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
				const newPage: PageNode = {
					id: pageId,
					name,
					children: [],
				}

				set((state) => ({
					document: {
						...state.document,
						children: [...state.document.children, newPage],
					},
					currentPageId: pageId,
					selection: [],
				}))

				return pageId
			},

			removePage(pageId: string) {
				set((state) => {
					if (state.document.children.length <= 1) return state // 최소 1개 페이지 유지

					const newPages = state.document.children.filter((p) => p.id !== pageId)
					const newCurrentPageId = state.currentPageId === pageId ? newPages[0].id : state.currentPageId

					return {
						document: { ...state.document, children: newPages },
						currentPageId: newCurrentPageId,
						selection: state.currentPageId === pageId ? [] : state.selection,
					}
				})
			},

			renamePage(pageId: string, name: string) {
				set((state) => ({
					document: {
						...state.document,
						children: state.document.children.map((p) => (p.id === pageId ? { ...p, name } : p)),
					},
				}))
			},

			// 유틸리티 메서드
			findNode(id: string): SceneNode | null {
				const page = getCurrentPage(get().document, get().currentPageId)
				if (!page) return null
				return findNodeInPage(page, id)
			},
		}),
		{
			partialize: (state) => ({
				document: state.document,
				components: state.components,
			}),
			limit: 50,
			onSave: (pastState, currentState) => {
				console.log("[History] 저장됨", {
					pastState,
					currentState,
					pastStates: useEditorStore.temporal.getState().pastStates.length,
					futureStates: useEditorStore.temporal.getState().futureStates.length,
				})
			},
		},
	),
)
