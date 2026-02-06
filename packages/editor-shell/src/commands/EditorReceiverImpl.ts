import type { ElementNode, Position, SceneNode, Size } from "@design-editor/core"

import type { useEditorStore } from "../store/editor"
import type { EditorReceiver, InstanceOverrides } from "./types"

/**
 * EditorReceiverImpl - EditorReceiver 구현체
 * Store 메서드를 래핑하여 Command에 제공
 */
export class EditorReceiverImpl implements EditorReceiver {
	constructor(private readonly store: typeof useEditorStore) {}

	// ========== 노드 액션 ==========

	updateNode(id: string, updates: Partial<SceneNode>) {
		this.store.getState().updateNode(id, updates)
	}

	addNode(parentId: string, node: SceneNode, index?: number) {
		this.store.getState().addNode(parentId, node, index)
	}

	removeNode(id: string) {
		this.store.getState().removeNode(id)
	}

	moveNode(id: string, position: Position) {
		this.store.getState().moveNode(id, position)
	}

	resizeNode(id: string, size: Size) {
		this.store.getState().resizeNode(id, size)
	}

	reorderNode(parentId: string, fromIndex: number, toIndex: number) {
		this.store.getState().reorderNode(parentId, fromIndex, toIndex)
	}

	reparentNode(sourceId: string, newParentId: string) {
		this.store.getState().reparentNode(sourceId, newParentId)
	}

	toggleVisibility(id: string) {
		this.store.getState().toggleVisibility(id)
	}

	toggleLocked(id: string) {
		this.store.getState().toggleLocked(id)
	}

	duplicateNode(id: string) {
		return this.store.getState().duplicateNode(id)
	}

	// ========== 컴포넌트 액션 ==========

	createComponent(nodeId: string, name: string) {
		return this.store.getState().createComponent(nodeId, name)
	}

	createInstance(componentId: string, parentId: string) {
		return this.store.getState().createInstance(componentId, parentId)
	}

	updateComponent(componentId: string, updates: Partial<ElementNode>) {
		this.store.getState().updateComponent(componentId, updates)
	}

	deleteComponent(componentId: string) {
		this.store.getState().deleteComponent(componentId)
	}

	setInstanceOverride(instanceId: string, targetNodeId: string, overrides: InstanceOverrides) {
		this.store.getState().setInstanceOverride(instanceId, targetNodeId, overrides)
	}

	resetInstanceOverrides(instanceId: string) {
		this.store.getState().resetInstanceOverrides(instanceId)
	}

	// ========== 페이지 액션 ==========

	addPage(name: string) {
		return this.store.getState().addPage(name)
	}

	removePage(pageId: string) {
		this.store.getState().removePage(pageId)
	}

	renamePage(pageId: string, name: string) {
		this.store.getState().renamePage(pageId, name)
	}

	// ========== 조회 메서드 ==========

	findNode(id: string) {
		return this.store.getState().findNode(id)
	}

	getCurrentPageId() {
		return this.store.getState().currentPageId
	}

	getCurrentPage() {
		const state = this.store.getState()
		return state.document.children.find((p) => p.id === state.currentPageId) ?? null
	}

	findNodeLocation(id: string) {
		const page = this.getCurrentPage()
		if (!page) return null

		// 페이지의 직접 자식인지 확인
		const pageChildIndex = page.children.findIndex((child) => child.id === id)
		if (pageChildIndex !== -1) {
			return { parentId: page.id, index: pageChildIndex }
		}

		// 트리에서 부모 찾기
		return this.findLocationInTree(page.children, id)
	}

	findPage(pageId: string) {
		return this.store.getState().document.children.find((p) => p.id === pageId) ?? null
	}

	getSelection() {
		return this.store.getState().selection
	}

	setSelection(ids: string[]) {
		this.store.getState().setSelection(ids)
	}

	// ========== Private 헬퍼 ==========

	private findLocationInTree(nodes: SceneNode[], targetId: string): { parentId: string; index: number } | null {
		for (const node of nodes) {
			if ("children" in node && Array.isArray(node.children)) {
				const index = node.children.findIndex((child) => child.id === targetId)
				if (index !== -1) {
					return { parentId: node.id, index }
				}

				const found = this.findLocationInTree(node.children, targetId)
				if (found) return found
			}
		}
		return null
	}
}
