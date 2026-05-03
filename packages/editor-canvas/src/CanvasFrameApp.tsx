import "@design-editor/components"

import type { NodeRect, PageNode, ShellMethods, SyncStatePayload } from "@design-editor/core"
import { type AsyncMethodReturns, connectToParent } from "penpal"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

import { collectNodeRects, getNodeRect, getTargetNodeId } from "./dom/nodeMeasurement"
import { CanvasRenderer } from "./Renderer/CanvasRenderer"

export function CanvasFrameApp() {
	const [currentPage, setCurrentPage] = useState<PageNode | null>(null)
	const [zoom, setZoom] = useState(1)
	const [panX, setPanX] = useState(0)
	const [panY, setPanY] = useState(0)
	const parentMethodsRef = useRef<AsyncMethodReturns<ShellMethods> | null>(null)

	const publishNodeRects = useCallback(() => {
		parentMethodsRef.current?.onNodeRectsUpdated(collectNodeRects())
	}, [])

	useEffect(() => {
		const connection = connectToParent<ShellMethods>({
			methods: {
				syncState(state: SyncStatePayload) {
					const page = state.document.children.find((p) => p.id === state.currentPageId)
					setCurrentPage(page ?? null)
					setZoom(state.zoom)
					setPanX(state.panX)
					setPanY(state.panY)
				},

				hitTest(x: number, y: number): string | null {
					const el = document.elementFromPoint(x, y)
					return getTargetNodeId(el)
				},

				getNodeRect(nodeId: string): NodeRect | null {
					return getNodeRect(nodeId)
				},

				getNodeRects(): Record<string, NodeRect> {
					return collectNodeRects()
				},
			},
		})

		connection.promise.then((parent) => {
			parentMethodsRef.current = parent
		})

		return () => {
			connection.destroy()
		}
	}, [])

	useLayoutEffect(() => {
		if (!currentPage) return

		const frameId = requestAnimationFrame(() => {
			publishNodeRects()
		})

		return () => cancelAnimationFrame(frameId)
	}, [currentPage, zoom, panX, panY, publishNodeRects])

	const handleTextChange = useCallback((nodeId: string, content: unknown) => {
		parentMethodsRef.current?.onTextChange(nodeId, content)
	}, [])

	if (!currentPage) {
		return <div className="loading">Loading...</div>
	}

	return (
		<div
			id="canvas-container"
			data-testid="canvas-container"
			data-ready="true"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: 0,
				height: 0,
				transformOrigin: "0 0",
				transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
				willChange: "transform",
				isolation: "isolate",
			}}
		>
			<CanvasRenderer page={currentPage} onTextChange={handleTextChange} />
		</div>
	)
}
