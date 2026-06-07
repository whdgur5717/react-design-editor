import "@design-editor/components"

import type { NodeRect, PageSnapshot } from "@design-editor/core"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { collectNodeRects, getNodeMeasureElements } from "./dom/nodeMeasurement"
import { CanvasRenderer } from "./Renderer/CanvasRenderer"
import type { ComponentResolver } from "./Renderer/renderNode"

export interface CanvasSurfaceProps {
	page: PageSnapshot | null
	zoom: number
	panX: number
	panY: number
	onTextChange?: (nodeId: string, content: unknown) => void
	onNodeRectsChange?: (rects: Record<string, NodeRect>) => void
	resolveComponent?: ComponentResolver
}

const noopTextChange = () => {}

function areRectsEqual(a: Record<string, NodeRect>, b: Record<string, NodeRect>) {
	const aKeys = Object.keys(a)
	const bKeys = Object.keys(b)
	if (aKeys.length !== bKeys.length) return false

	for (const key of aKeys) {
		const left = a[key]
		const right = b[key]
		if (!right) return false
		if (left.x !== right.x || left.y !== right.y || left.width !== right.width || left.height !== right.height) {
			return false
		}
	}

	return true
}

export function CanvasSurface({
	page,
	zoom,
	panX,
	panY,
	onTextChange = noopTextChange,
	onNodeRectsChange,
	resolveComponent,
}: CanvasSurfaceProps) {
	const pageId = page?.id ?? null
	const [surfaceElement, setSurfaceElement] = useState<HTMLDivElement | null>(null)
	const frameRef = useRef<number | null>(null)
	const lastPageIdRef = useRef<string | null>(null)
	const lastRectsRef = useRef<Record<string, NodeRect>>({})

	function cancelScheduledNodeRectPublish() {
		if (frameRef.current === null) {
			return
		}

		cancelAnimationFrame(frameRef.current)
		frameRef.current = null
	}

	function publishNodeRects() {
		if (page && !surfaceElement) {
			return
		}

		const nextPageId = pageId
		const nextRects = surfaceElement && page ? collectNodeRects(surfaceElement, page) : {}
		const pageChanged = lastPageIdRef.current !== nextPageId

		if (!pageChanged && areRectsEqual(lastRectsRef.current, nextRects)) {
			return
		}

		lastPageIdRef.current = nextPageId
		lastRectsRef.current = nextRects
		onNodeRectsChange?.(nextRects)
	}

	function scheduleNodeRectPublish() {
		if (frameRef.current !== null) {
			return
		}

		frameRef.current = requestAnimationFrame(() => {
			frameRef.current = null
			publishNodeRects()
		})
	}

	useLayoutEffect(function publishNodeRectsAfterRender() {
		scheduleNodeRectPublish()
		return cancelScheduledNodeRectPublish
	})

	useEffect(
		function observeMeasuredNodeElements() {
			const surface = surfaceElement
			if (!surface || !pageId) return

			const resizeObserver = new ResizeObserver(function handleResize() {
				scheduleNodeRectPublish()
			})
			const mutationObserver = new MutationObserver(function handleMutation() {
				observeMeasuredElements(surface)
			})

			function observeMeasuredElements(currentSurface: HTMLDivElement) {
				resizeObserver.disconnect()
				resizeObserver.observe(currentSurface)

				for (const element of getNodeMeasureElements(currentSurface)) {
					if (element instanceof HTMLElement) resizeObserver.observe(element)
				}

				scheduleNodeRectPublish()
			}

			observeMeasuredElements(surface)
			mutationObserver.observe(surface, {
				attributes: true,
				childList: true,
				subtree: true,
				attributeFilter: ["class", "style", "data-node-measure-id"],
			})

			return function disconnectNodeObservers() {
				resizeObserver.disconnect()
				mutationObserver.disconnect()
			}
		},
		[surfaceElement, pageId, onNodeRectsChange],
	)

	return (
		<div
			ref={setSurfaceElement}
			id="canvas-container"
			className="de-canvas-surface"
			data-testid="canvas-container"
			data-ready={page ? "true" : "false"}
		>
			{page ? (
				<div
					className="de-canvas-stage"
					style={{
						transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
					}}
				>
					<CanvasRenderer page={page} onTextChange={onTextChange} resolveComponent={resolveComponent} />
				</div>
			) : (
				<div className="loading">Loading...</div>
			)}
		</div>
	)
}
