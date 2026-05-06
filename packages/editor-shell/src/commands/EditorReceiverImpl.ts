import type { NodePageContext, Position, SceneNode, Size } from "@design-editor/core"
import type { CSSProperties } from "react"

import type { EditorStoreApi } from "../store/editor"
import type { EditorReceiver } from "./types"

/**
 * EditorReceiverImpl - EditorReceiver 구현체
 * Store 메서드를 래핑하여 Command에 제공
 */
export class EditorReceiverImpl implements EditorReceiver {
	constructor(private readonly store: EditorStoreApi) {}

	// ========== 노드 액션 ==========

	updateNode(id: string, updates: Partial<SceneNode>, context?: NodePageContext) {
		this.store.getState().updateNode(id, updates, context)
	}

	addNode(parentId: string, node: SceneNode, index?: number, context?: NodePageContext) {
		this.store.getState().addNode(parentId, node, index, context)
	}

	removeNode(id: string, context?: NodePageContext) {
		this.store.getState().removeNode(id, context)
	}

	moveNode(id: string, position: Position, context?: NodePageContext) {
		this.store.getState().moveNode(id, position, context)
	}

	resizeNode(id: string, size: Size, context?: NodePageContext) {
		this.store.getState().resizeNode(id, size, context)
	}

	reorderNode(parentId: string, fromIndex: number, toIndex: number, context?: NodePageContext) {
		this.store.getState().reorderNode(parentId, fromIndex, toIndex, context)
	}

	reparentNode(sourceId: string, newParentId: string, context?: NodePageContext) {
		this.store.getState().reparentNode(sourceId, newParentId, context)
	}

	toggleVisibility(id: string, context?: NodePageContext) {
		this.store.getState().toggleVisibility(id, context)
	}

	toggleLocked(id: string, context?: NodePageContext) {
		this.store.getState().toggleLocked(id, context)
	}

	duplicateNode(id: string) {
		return this.store.getState().duplicateNode(id)
	}

	updateNodeStyle(id: string, styleUpdates: Partial<CSSProperties>) {
		this.store.getState().updateNodeStyle(id, styleUpdates)
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

	findNode(id: string, context?: NodePageContext) {
		return this.store.getState().findNode(id, context)
	}

	getCurrentPageId() {
		return this.store.getState().currentPageId
	}

	getCurrentPage() {
		const state = this.store.getState()
		return state.document.children.find((p) => p.id === state.currentPageId) ?? null
	}

	findNodeLocation(id: string, context?: NodePageContext) {
		return this.store.getState().findNodeLocation(id, context)
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
}
