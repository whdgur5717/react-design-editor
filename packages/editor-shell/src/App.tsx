import type { CanvasGesture, CanvasMethods } from "@design-editor/core"
import type { AsyncMethodReturns } from "penpal"
import { connectToChild } from "penpal"
import { useEffect, useRef } from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { registerAllShortcuts } from "./commands"
import { LayersPanel } from "./components/LayersPanel"
import { PropertiesPanel } from "./components/PropertiesPanel"
import { Toolbar } from "./components/Toolbar"
import { gestureRouter } from "./gestures"
import { useEditorStore } from "./store/editor"
import { FrameTool, SelectTool, TextTool, toolRegistry } from "./tools"

export function App() {
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const canvasRef = useRef<AsyncMethodReturns<CanvasMethods> | null>(null)

	// 초기화 (한 번만)
	useEffect(() => {
		// Tool 등록
		toolRegistry.register("select", new SelectTool())
		toolRegistry.register("frame", new FrameTool())
		toolRegistry.register("text", new TextTool())

		registerAllShortcuts()
	}, [])

	useEffect(() => {
		if (!iframeRef.current) return

		const canvasConnection = connectToChild<CanvasMethods>({
			iframe: iframeRef.current,
			methods: {
				// 통합 Gesture 핸들러
				onGesture(gesture: CanvasGesture) {
					gestureRouter.handle(gesture)
				},
			},
		})

		canvasConnection.promise.then((child) => {
			canvasRef.current = child
			// 초기 상태 동기화
			const state = useEditorStore.getState()
			child.syncState({
				document: state.document,
				currentPageId: state.currentPageId,
				components: state.components,
				zoom: state.zoom,
				selection: state.selection,
				activeTool: state.activeTool,
				cursor: toolRegistry.getActiveTool()?.cursor ?? "default",
			})
		})

		// store 변경 시 Canvas에 동기화
		const unsubscribe = useEditorStore.subscribe((state) => {
			canvasRef.current?.syncState({
				document: state.document,
				currentPageId: state.currentPageId,
				components: state.components,
				zoom: state.zoom,
				selection: state.selection,
				activeTool: state.activeTool,
				cursor: toolRegistry.getActiveTool()?.cursor ?? "default",
			})
		})

		// Shell 키보드 이벤트 캡처
		const handleKeyDown = (e: KeyboardEvent) => {
			// iframe 내부에서 발생한 이벤트는 무시 (Canvas에서 별도 처리)
			if ((e.target as HTMLElement)?.tagName === "IFRAME") return

			gestureRouter.handle({
				type: "key",
				state: "began",
				nodeId: null,
				payload: {
					key: e.key,
					code: e.code,
					shiftKey: e.shiftKey,
					ctrlKey: e.ctrlKey,
					metaKey: e.metaKey,
					altKey: e.altKey,
				},
			})
		}

		const handleKeyUp = (e: KeyboardEvent) => {
			if ((e.target as HTMLElement)?.tagName === "IFRAME") return

			gestureRouter.handle({
				type: "key",
				state: "ended",
				nodeId: null,
				payload: {
					key: e.key,
					code: e.code,
					shiftKey: e.shiftKey,
					ctrlKey: e.ctrlKey,
					metaKey: e.metaKey,
					altKey: e.altKey,
				},
			})
		}

		window.addEventListener("keydown", handleKeyDown, { capture: true })
		window.addEventListener("keyup", handleKeyUp, { capture: true })

		return () => {
			unsubscribe()
			canvasConnection.destroy()
			window.removeEventListener("keydown", handleKeyDown, { capture: true })
			window.removeEventListener("keyup", handleKeyUp, { capture: true })
		}
	}, [])

	return (
		<div className="app">
			<Toolbar />
			<PanelGroup direction="horizontal" className="main-content">
				<Panel defaultSize={15} minSize={10} maxSize={25}>
					<LayersPanel />
				</Panel>
				<PanelResizeHandle className="resize-handle" />
				<Panel defaultSize={60} minSize={30}>
					<div className="canvas-container">
						<iframe ref={iframeRef} src="http://localhost:3001" title="Canvas" className="canvas-iframe" />
					</div>
				</Panel>
				<PanelResizeHandle className="resize-handle" />
				<Panel defaultSize={25} minSize={15} maxSize={35}>
					<PropertiesPanel />
				</Panel>
			</PanelGroup>
		</div>
	)
}
