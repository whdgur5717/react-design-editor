import "./App.css"
import "@design-editor/components"

import type { EditorTool, NodeRect, PageNode, ShellMethods, SyncStatePayload } from "@design-editor/core"
import { type AsyncMethodReturns, connectToParent } from "penpal"
import { type ComponentType, useCallback, useEffect, useRef, useState } from "react"

import { CanvasRenderer } from "./Renderer/CanvasRenderer"

function getTargetNodeId(el: Element | null): string | null {
	while (el && el !== document.body) {
		if (el instanceof HTMLElement && el.dataset.nodeId) return el.dataset.nodeId
		el = el.parentElement
	}
	return null
}

export function App() {
	const [currentPage, setCurrentPage] = useState<PageNode | null>(null)
	const [zoom, setZoom] = useState(1)
	const [panX, setPanX] = useState(0)
	const [panY, setPanY] = useState(0)
	const [, setActiveTool] = useState<EditorTool>("select")
	const [codeComponentMap, setCodeComponentMap] = useState<Record<string, ComponentType<Record<string, unknown>>>>({})
	const loadedSourcesRef = useRef<Record<string, string>>({})
	const parentMethodsRef = useRef<AsyncMethodReturns<ShellMethods> | null>(null)
	const loadCodeComponents = useCallback(async (sources: Record<string, string>) => {
		const newMap: Record<string, ComponentType<Record<string, unknown>>> = {}
		let changed = false

		for (const [id, compiledCode] of Object.entries(sources)) {
			if (loadedSourcesRef.current[id] === compiledCode) {
				// Reuse previously loaded component
				setCodeComponentMap((prev) => {
					if (prev[id]) newMap[id] = prev[id]
					return prev
				})
				continue
			}

			try {
				const blob = new Blob([compiledCode], { type: "text/javascript" })
				const url = URL.createObjectURL(blob)
				const mod: { default?: ComponentType<Record<string, unknown>> } = await import(/* @vite-ignore */ url)
				URL.revokeObjectURL(url)
				if (mod.default) {
					newMap[id] = mod.default
					loadedSourcesRef.current[id] = compiledCode
					changed = true
				}
			} catch (e) {
				console.error(`Failed to load code component ${id}:`, e)
			}
		}

		// Remove deleted components
		for (const id of Object.keys(loadedSourcesRef.current)) {
			if (!sources[id]) {
				delete loadedSourcesRef.current[id]
				changed = true
			}
		}

		if (changed) {
			setCodeComponentMap((prev) => ({ ...prev, ...newMap }))
		}
	}, [])

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
					setZoom(state.zoom)
					setPanX(state.panX)
					setPanY(state.panY)
					setActiveTool(state.activeTool)

					if (state.codeComponentSources && Object.keys(state.codeComponentSources).length > 0) {
						loadCodeComponents(state.codeComponentSources)
					}

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
			data-ready="true"
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
			<style>{`#canvas-container { transform-origin: 0 0; transform: translate(${panX}px, ${panY}px) scale(${zoom}); }`}</style>
			<CanvasRenderer page={currentPage} codeComponents={codeComponentMap} onTextChange={handleTextChange} />
		</div>
	)
}
