import type { PageNode, SceneNode } from "@design-editor/core"
import { useEffect } from "react"

import { useEditorStore } from "../store/editor"

/**
 * SceneNode에서 모든 노드 ID를 수집
 */
function collectNodeIds(node: SceneNode): string[] {
	const ids = [node.id]
	if ("children" in node && Array.isArray(node.children)) {
		for (const child of node.children) {
			ids.push(...collectNodeIds(child))
		}
	}
	return ids
}

/**
 * 페이지 내 모든 노드 ID를 수집
 */
function collectAllNodeIdsInPage(page: PageNode): string[] {
	const ids: string[] = []
	for (const node of page.children) {
		ids.push(...collectNodeIds(node))
	}
	return ids
}

/**
 * 키보드 단축키 훅
 * - Delete/Backspace: 선택된 노드 삭제
 * - Escape: 선택 해제
 * - Cmd/Ctrl+A: 전체 선택 (루트 제외)
 * - Cmd/Ctrl+D: 선택된 노드 복제
 */
export function useKeyboardShortcuts() {
	const document = useEditorStore((state) => state.document)
	const currentPageId = useEditorStore((state) => state.currentPageId)
	const selection = useEditorStore((state) => state.selection)
	const setSelection = useEditorStore((state) => state.setSelection)
	const removeNode = useEditorStore((state) => state.removeNode)
	const duplicateNode = useEditorStore((state) => state.duplicateNode)

	useEffect(() => {
		const currentPage = document.children.find((p) => p.id === currentPageId)
		if (!currentPage) return

		const handleKeyDown = (e: KeyboardEvent) => {
			// input, textarea 등에서는 단축키 무시
			const target = e.target as HTMLElement
			if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
				return
			}

			const isMeta = e.metaKey || e.ctrlKey

			// Delete/Backspace: 선택된 노드 삭제
			if (e.key === "Delete" || e.key === "Backspace") {
				e.preventDefault()
				selection.forEach((id) => removeNode(id))
			}

			// Escape: 선택 해제
			if (e.key === "Escape") {
				e.preventDefault()
				setSelection([])
			}

			// Cmd/Ctrl+A: 전체 선택
			if (isMeta && e.key === "a") {
				e.preventDefault()
				const allIds = collectAllNodeIdsInPage(currentPage)
				setSelection(allIds)
			}

			// Cmd/Ctrl+D: 노드 복제
			if (isMeta && e.key === "d") {
				e.preventDefault()
				if (selection.length === 1) {
					duplicateNode(selection[0])
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [document, currentPageId, selection, setSelection, removeNode, duplicateNode])
}
