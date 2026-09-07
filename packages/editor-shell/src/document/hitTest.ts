import type { NodeRect, PageNode, SceneNode } from "@open-editor-sdk/core"

import { getCachedNodePageRect, screenToData } from "../utils/nodePosition"

export function hitTestNodeIdInPage(
	page: PageNode,
	cache: Record<string, NodeRect>,
	zoom: number,
	panX: number,
	panY: number,
	clientX: number,
	clientY: number,
): string | null {
	const orderedIds: string[] = []
	collectIdsInRenderOrder(page.children, orderedIds)
	const point = screenToData(clientX, clientY, zoom, panX, panY)

	for (let i = orderedIds.length - 1; i >= 0; i--) {
		const id = orderedIds[i]
		const rect = getCachedNodePageRect(id, cache)
		if (!rect) continue
		if (containsPoint(rect, point.x, point.y)) return id
	}

	return null
}

function collectIdsInRenderOrder(nodes: SceneNode[], out: string[]) {
	for (const node of nodes) {
		if (node.visible === false) continue
		out.push(node.id)
		if (Array.isArray(node.children) && node.children.length > 0) {
			collectIdsInRenderOrder(node.children, out)
		}
	}
}

function containsPoint(rect: NodeRect, x: number, y: number) {
	return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
}
