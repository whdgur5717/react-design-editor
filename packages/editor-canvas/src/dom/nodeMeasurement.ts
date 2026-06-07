import type { NodeRect, NodeSnapshot, PageSnapshot } from "@design-editor/core"

const NODE_ID_SELECTOR = "[data-node-id]"
const NODE_MEASURE_SELECTOR = "[data-node-measure-id]"
type NodeTreeInfo = {
	isRoot: boolean
	x: number
	y: number
}

export function getTargetNodeId(el: Element | null, boundary?: ParentNode | null): string | null {
	while (el && el !== document.body && el !== boundary) {
		if (el instanceof HTMLElement && el.dataset.nodeId) return el.dataset.nodeId
		el = el.parentElement
	}

	return null
}

function collectNodeTreeInfo(page: PageSnapshot) {
	const nodeInfo: Record<string, NodeTreeInfo> = {}

	function visit(nodes: readonly NodeSnapshot[], isRoot: boolean) {
		for (const node of nodes) {
			nodeInfo[node.id] = {
				isRoot,
				x: node.x ?? 0,
				y: node.y ?? 0,
			}

			if (Array.isArray(node.children)) {
				visit(node.children, false)
			}
		}
	}

	visit(page.children, true)
	return nodeInfo
}

function getMeasuredElement(element: HTMLElement) {
	const child = element.firstElementChild
	return child instanceof HTMLElement ? child : element
}

function getLayoutOffsetFromDocument(element: HTMLElement) {
	let x = 0
	let y = 0
	let current: HTMLElement | null = element

	while (current) {
		x += current.offsetLeft
		y += current.offsetTop
		current = current.offsetParent as HTMLElement | null
	}

	return { x, y }
}

function getLayoutOffsetBetween(element: HTMLElement, ancestor: HTMLElement) {
	const elementOffset = getLayoutOffsetFromDocument(element)
	const ancestorOffset = getLayoutOffsetFromDocument(ancestor)

	return {
		x: elementOffset.x - ancestorOffset.x,
		y: elementOffset.y - ancestorOffset.y,
	}
}

function findMeasuredAncestor(element: HTMLElement) {
	let current = element.parentElement

	while (current) {
		if (current instanceof HTMLElement && current.dataset.nodeMeasureId) {
			return current
		}
		current = current.parentElement
	}

	return null
}

export function measureNodeRect(el: HTMLElement, page: PageSnapshot): NodeRect | null {
	const nodeId = el.dataset.nodeMeasureId
	if (!nodeId) return null
	const root = el.getRootNode()
	const searchRoot = root instanceof Document || root instanceof ShadowRoot ? root : el.ownerDocument
	return collectNodeRects(searchRoot, page)[nodeId] ?? null
}

export function collectNodeRects(root: ParentNode = document, page?: PageSnapshot | null): Record<string, NodeRect> {
	const rects: Record<string, NodeRect> = {}
	if (!page) return rects

	const nodeInfo = collectNodeTreeInfo(page)
	const elements = root.querySelectorAll(NODE_MEASURE_SELECTOR)

	for (const el of elements) {
		if (!(el instanceof HTMLElement)) continue
		const nodeId = el.dataset.nodeMeasureId
		if (!nodeId) continue
		const info = nodeInfo[nodeId]
		if (!info) continue

		let x = info.x
		let y = info.y

		if (!info.isRoot) {
			const ancestor = findMeasuredAncestor(el)
			const ancestorId = ancestor?.dataset.nodeMeasureId
			const ancestorRect = ancestorId ? rects[ancestorId] : null

			if (!ancestor || !ancestorRect) continue

			const offset = getLayoutOffsetBetween(getMeasuredElement(el), getMeasuredElement(ancestor))
			x = ancestorRect.x + offset.x
			y = ancestorRect.y + offset.y
		}

		const measuredElement = getMeasuredElement(el)
		rects[nodeId] = {
			x,
			y,
			width: measuredElement.offsetWidth,
			height: measuredElement.offsetHeight,
		}
	}

	return rects
}

export function getNodeRect(nodeId: string, root: ParentNode = document, page?: PageSnapshot | null): NodeRect | null {
	if (!page) return null
	const el = root.querySelector(`${NODE_MEASURE_SELECTOR}[data-node-measure-id="${nodeId}"]`)
	if (!(el instanceof HTMLElement)) return null
	return measureNodeRect(el, page)
}

export function getNodeMeasureElements(root: ParentNode = document) {
	return Array.from(root.querySelectorAll(NODE_MEASURE_SELECTOR)).map((element) => {
		if (!(element instanceof HTMLElement)) return element
		return getMeasuredElement(element)
	})
}

export function getNodeElements(root: ParentNode = document) {
	return root.querySelectorAll(NODE_ID_SELECTOR)
}
