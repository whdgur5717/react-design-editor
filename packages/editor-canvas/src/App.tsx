import "./App.css"
import "@design-editor/components"

import type {
	ComponentDefinition,
	EditorTool,
	NodeRect,
	PageNode,
	ShellMethods,
	SyncStatePayload,
} from "@design-editor/core"
import { type AsyncMethodReturns, connectToParent } from "penpal"
import { useCallback, useEffect, useRef, useState } from "react"

import { CanvasRenderer } from "./renderer/CanvasRenderer"

function getTargetNodeId(el: Element | null): string | null {
	while (el && el !== document.body) {
		if (el instanceof HTMLElement && el.dataset.nodeId) return el.dataset.nodeId
		el = el.parentElement
	}
	return null
}

export function App() {
	const [currentPage, setCurrentPage] = useState<PageNode | null>(null)
	const [components, setComponents] = useState<ComponentDefinition[]>([])
	const [zoom, setZoom] = useState(1)
	const [, setActiveTool] = useState<EditorTool>("select")
	const parentMethodsRef = useRef<AsyncMethodReturns<ShellMethods> | null>(null)

	useEffect(() => {
		function collectNodeRects(): Record<string, NodeRect> {
			const rects: Record<string, NodeRect> = {}
			const elements = document.querySelectorAll("[data-node-id]")
			for (const el of elements) {
				const nodeId = (el as HTMLElement).dataset.nodeId
				if (!nodeId) continue
				const rect = el.getBoundingClientRect()
				rects[nodeId] = { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
			}
			return rects
		}

		const connection = connectToParent<ShellMethods>({
			methods: {
				syncState(state: SyncStatePayload) {
					const page = state.document.children.find((p) => p.id === state.currentPageId)
					setCurrentPage(page ?? null)
					setComponents(state.components)
					setZoom(state.zoom)
					setActiveTool(state.activeTool)

					requestAnimationFrame(() => {
						const rects = collectNodeRects()
						parentMethodsRef.current?.onNodeRectsUpdated(rects)
					})
				},

				hitTest(x: number, y: number): string | null {
					const el = document.elementFromPoint(x, y)
					return getTargetNodeId(el)
				},

				getNodeRect(nodeId: string) {
					const el = document.querySelector(`[data-node-id="${nodeId}"]`)
					if (!el) return null
					const rect = el.getBoundingClientRect()
					return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
				},

				getNodeRects() {
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

	const handleTextChange = useCallback((nodeId: string, content: unknown) => {
		parentMethodsRef.current?.onTextChange(nodeId, content)
	}, [])

	if (!currentPage) {
		return <div className="loading">Loading...</div>
	}

	return (
		<div
			id="canvas-container"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: 0,
				height: 0,
				willChange: "transform",
				isolation: "isolate",
			}}
		>
			<style>{`#canvas-container { transform: scale(${zoom}) translateX(0px) translateY(0px); }`}</style>
			<CanvasRenderer page={currentPage} components={components} onTextChange={handleTextChange} />
		</div>
	)
}
