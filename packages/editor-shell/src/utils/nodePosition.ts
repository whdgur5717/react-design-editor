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

/**
 * 노드의 위치와 크기를 page space로 반환.
 * 루트 노드는 데이터에서 직접 계산, 비루트 노드는 Canvas가 측정한 캐시를 역변환해서 구한다.
 */
export function getNodePageRectHybrid(
	nodeId: string,
	zoom: number,
	page: PageNode,
	cache: Record<string, NodeRect>,
	panX = 0,
	panY = 0,
): Rect | null {
	if (isRootNode(nodeId, page)) {
		const dataRect = getNodePageRect(nodeId, page)
		if (!dataRect) return null

		if (dataRect.width === 0 || dataRect.height === 0) {
			const cached = cache[nodeId]
			if (cached) {
				// 캐시는 screen space이므로 zoom으로 나눠 page space로 변환
				if (dataRect.width === 0) dataRect.width = cached.width / zoom
				if (dataRect.height === 0) dataRect.height = cached.height / zoom
			}
		}

		return dataRect
	}

	const cached = cache[nodeId]
	if (!cached) return null

	// 캐시는 getBoundingClientRect() 값이라 zoom/pan이 적용돼있음.
	// page space로 복원: pan 빼고 zoom으로 나눈다.
	return {
		x: (cached.x - panX) / zoom,
		y: (cached.y - panY) / zoom,
		width: cached.width / zoom,
		height: cached.height / zoom,
	}
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
