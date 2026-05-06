import type { NodeRect, PageNode, SceneNode } from "@design-editor/core"
import { isNumber } from "es-toolkit/compat"

export interface Rect {
	x: number
	y: number
	width: number
	height: number
}

/** 조상 노드들의 x/y를 재귀적으로 합산해서 페이지 원점 기준 절대 좌표를 구한다 */
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

/** 노드의 위치(x,y)와 크기(w,h)를 page space로 반환. overlay가 테두리를 그릴 위치를 잡을 때 사용 */
export function getNodePageRect(nodeId: string, page: PageNode): Rect | null {
	const node = findNodeInPage(page, nodeId)
	if (!node) return null

	const abs = getAbsolutePosition(nodeId, page)
	const width = isNumber(node.style?.width) ? node.style.width : 0
	const height = isNumber(node.style?.height) ? node.style.height : 0

	return {
		x: abs.x,
		y: abs.y,
		width,
		height,
	}
}

/**
 * screen 좌표 → data 좌표 변환
 */
export function screenToData(screenX: number, screenY: number, zoom: number, panX: number, panY: number) {
	return {
		x: (screenX - panX) / zoom,
		y: (screenY - panY) / zoom,
	}
}

/**
 * 노드가 페이지 직속 루트인지 판별
 */
export function isRootNode(nodeId: string, page: PageNode): boolean {
	return page.children.some((c) => c.id === nodeId)
}

export function getCachedNodePageRect(nodeId: string, cache: Record<string, NodeRect>): Rect | null {
	return cache[nodeId] ?? null
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
