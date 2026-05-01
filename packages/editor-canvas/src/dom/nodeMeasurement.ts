import type { NodeRect } from "@design-editor/core"

const NODE_ID_SELECTOR = "[data-node-id]"
const NODE_MEASURE_SELECTOR = "[data-node-measure-id]"

export function getTargetNodeId(el: Element | null): string | null {
	while (el && el !== document.body) {
		if (el instanceof HTMLElement && el.dataset.nodeId) return el.dataset.nodeId
		el = el.parentElement
	}

	return null
}

export function measureNodeRect(el: HTMLElement): NodeRect {
	const rect = el.getBoundingClientRect()
	return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
}

export function collectNodeRects(root: ParentNode = document): Record<string, NodeRect> {
	const rects: Record<string, NodeRect> = {}
	const elements = root.querySelectorAll(NODE_MEASURE_SELECTOR)

	for (const el of elements) {
		if (!(el instanceof HTMLElement)) continue
		const nodeId = el.dataset.nodeMeasureId
		if (!nodeId) continue
		rects[nodeId] = measureNodeRect(el)
	}

	return rects
}

export function getNodeRect(nodeId: string, root: ParentNode = document): NodeRect | null {
	const el = root.querySelector(`${NODE_MEASURE_SELECTOR}[data-node-measure-id="${nodeId}"]`)
	if (!(el instanceof HTMLElement)) return null
	return measureNodeRect(el)
}

export function getNodeMeasureElements(root: ParentNode = document) {
	return root.querySelectorAll(NODE_MEASURE_SELECTOR)
}

export function getNodeElements(root: ParentNode = document) {
	return root.querySelectorAll(NODE_ID_SELECTOR)
}
