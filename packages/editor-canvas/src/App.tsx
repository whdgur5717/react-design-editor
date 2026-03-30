import "./App.css"
import "@design-editor/components"

import type { EditorTool, PageNode, ShellMethods, SyncStatePayload } from "@design-editor/core"
import { type AsyncMethodReturns, connectToParent } from "penpal"
import { type ComponentType, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

import { collectNodeRects, getNodeRect, getTargetNodeId } from "./dom/nodeMeasurement"
import { CanvasRenderer } from "./Renderer/CanvasRenderer"

export function App() {
	const [currentPage, setCurrentPage] = useState<PageNode | null>(null)
	const [zoom, setZoom] = useState(1)
	const [panX, setPanX] = useState(0)
	const [panY, setPanY] = useState(0)
	const [, setActiveTool] = useState<EditorTool>("select")
	const [codeComponentMap, setCodeComponentMap] = useState<Record<string, ComponentType<Record<string, unknown>>>>({})
	const loadedSourcesRef = useRef<Record<string, string>>({})
	const parentMethodsRef = useRef<AsyncMethodReturns<ShellMethods> | null>(null)

	const publishNodeRects = useCallback(() => {
		parentMethodsRef.current?.onNodeRectsUpdated(collectNodeRects())
	}, [])

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
				},

				hitTest(x: number, y: number): string | null {
					const el = document.elementFromPoint(x, y)
					return getTargetNodeId(el)
				},

				getNodeRect(nodeId: string) {
					return getNodeRect(nodeId)
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
	}, [loadCodeComponents])

	useLayoutEffect(() => {
		if (!currentPage) return

		const frameId = requestAnimationFrame(() => {
			publishNodeRects()
		})

		return () => cancelAnimationFrame(frameId)
	}, [currentPage, zoom, panX, panY, codeComponentMap, publishNodeRects])

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
				transformOrigin: "0 0",
				transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
				willChange: "transform",
				isolation: "isolate",
			}}
		>
			<CanvasRenderer page={currentPage} codeComponents={codeComponentMap} onTextChange={handleTextChange} />
		</div>
	)
}
