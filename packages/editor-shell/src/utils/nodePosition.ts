import type { NodeRect, PageNode, SceneNode } from "@design-editor/core"
import { isNumber } from "es-toolkit/compat"

export interface Rect {
	x: number
	y: number
	width: number
	height: number
}

/**
 * 노드의 절대 좌표 (페이지 루트 기준, 조상 left/top 합산)
 * 순수 함수: page 데이터를 인자로 받는다.
 */
export function getAbsolutePosition(nodeId: string, page: PageNode): { x: number; y: number } {
	let x = 0
	let y = 0
	let currentId = nodeId

	while (currentId !== page.id) {
		const node = findNodeInPage(page, currentId)
		if (!node) break
		x += node.x ?? 0
		y += node.y ?? 0
		const parentId = findParentId(page, currentId)
		if (!parentId) break
		currentId = parentId
	}

	return { x, y }
}

/**
 * 노드의 스크린 좌표 rect
 * 순수 함수: zoom, page를 인자로 받는다.
 */
export function getNodeScreenRect(nodeId: string, zoom: number, page: PageNode): Rect | null {
	const node = findNodeInPage(page, nodeId)
	if (!node) return null

	const abs = getAbsolutePosition(nodeId, page)
	const width = isNumber(node.style?.width) ? node.style.width : 0
	const height = isNumber(node.style?.height) ? node.style.height : 0

	return {
		x: abs.x * zoom,
		y: abs.y * zoom,
		width: width * zoom,
		height: height * zoom,
	}
}

/**
 * 노드가 페이지 직속 루트인지 판별
 */
export function isRootNode(nodeId: string, page: PageNode): boolean {
	return page.children.some((c) => c.id === nodeId)
}

/**
 * 하이브리드 rect 계산:
 * - 루트 노드 → 기존 getNodeScreenRect (데이터 기반)
 * - 자식 노드 → Canvas push 캐시 기반
 */
export function getNodeScreenRectHybrid(
	nodeId: string,
	zoom: number,
	page: PageNode,
	cache: Record<string, NodeRect>,
): Rect | null {
	if (isRootNode(nodeId, page)) {
		return getNodeScreenRect(nodeId, zoom, page)
	}

	const cached = cache[nodeId]
	if (!cached) return null

	// Canvas의 rect는 이미 zoom이 적용된 스크린 좌표
	return { x: cached.x, y: cached.y, width: cached.width, height: cached.height }
}

// ── 로컬 헬퍼 ──

function findNodeInPage(page: PageNode, id: string): SceneNode | null {
	for (const child of page.children) {
		if (child.id === id) return child
		const found = findNodeRecursive(child, id)
		if (found) return found
	}
	return null
}

function findNodeRecursive(node: SceneNode, id: string): SceneNode | null {
	if ("children" in node && Array.isArray(node.children)) {
		for (const child of node.children) {
			if (child.id === id) return child
			const found = findNodeRecursive(child, id)
			if (found) return found
		}
	}
	return null
}

function findParentId(page: PageNode, targetId: string): string | null {
	for (const child of page.children) {
		if (child.id === targetId) return page.id
		const result = findParentIdRecursive(child, targetId)
		if (result) return result
	}
	return null
}

function findParentIdRecursive(node: SceneNode, targetId: string): string | null {
	if ("children" in node && Array.isArray(node.children)) {
		for (const child of node.children) {
			if (child.id === targetId) return node.id
			const result = findParentIdRecursive(child, targetId)
			if (result) return result
		}
	}
	return null
}
