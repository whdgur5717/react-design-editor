import type { CanvasDndEndEvent, CanvasMethods } from "@design-editor/core"
import type { AsyncMethodReturns } from "penpal"
import { connectToChild } from "penpal"
import { useEffect, useRef } from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { registerAllCommands } from "./commands"
import { LayersPanel } from "./components/LayersPanel"
import { PropertiesPanel } from "./components/PropertiesPanel"
import { Toolbar } from "./components/Toolbar"
import {
	type CanvasKeyEvent,
	type CanvasPointerEvent,
	eventBus,
	eventRouter,
	type EventType,
	EventTypes,
} from "./events"
import { useEditorStore } from "./store/editor"
import { FrameTool, SelectTool, TextTool, toolRegistry } from "./tools"

export function App() {
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const canvasRef = useRef<AsyncMethodReturns<CanvasMethods> | null>(null)

	// 이벤트 시스템 초기화 (한 번만)
	useEffect(() => {
		// Tool 등록
		toolRegistry.register("select", new SelectTool())
		toolRegistry.register("frame", new FrameTool())
		toolRegistry.register("text", new TextTool())

		// Command 등록
		registerAllCommands()

		// EventRouter 초기화
		eventRouter.init()

		return () => {
			eventRouter.destroy()
		}
	}, [])

	useEffect(() => {
		if (!iframeRef.current) return

		const canvasConnection = connectToChild<CanvasMethods>({
			iframe: iframeRef.current,
			methods: {
				// 새로운 이벤트 시스템
				onCanvasPointerEvent(event: CanvasPointerEvent) {
					// 리사이즈 이벤트 처리
					if (event.isResizeStart) {
						useEditorStore.temporal.getState().pause()
						return
					}
					if (event.isResizeEnd) {
						const nodeId = event.targetNodeId
						if (nodeId && event.width !== undefined && event.height !== undefined) {
							useEditorStore.getState().resizeNode(nodeId, {
								width: event.width,
								height: event.height,
							})
						}
						useEditorStore.temporal.getState().resume()
						return
					}

					// 일반 포인터 이벤트
					const eventType = event.type === "dragend" ? EventTypes.CANVAS_DRAG_END : (`canvas:${event.type}` as EventType)
					eventBus.dispatch(eventType, event)
				},
				onCanvasKeyEvent(event: CanvasKeyEvent) {
					eventBus.dispatch(`canvas:${event.type}` as EventType, event)
				},
				onCanvasDndEnd(event: CanvasDndEndEvent) {
					const { activeNodeId, overNodeId, delta } = event
					useEditorStore.getState().dropNode(activeNodeId, overNodeId, delta)
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

			eventBus.dispatch(EventTypes.SHELL_KEY_DOWN, {
				type: "keydown" as const,
				key: e.key,
				code: e.code,
				shiftKey: e.shiftKey,
				ctrlKey: e.ctrlKey,
				metaKey: e.metaKey,
				altKey: e.altKey,
			})
		}

		const handleKeyUp = (e: KeyboardEvent) => {
			if ((e.target as HTMLElement)?.tagName === "IFRAME") return

			eventBus.dispatch(EventTypes.SHELL_KEY_UP, {
				type: "keyup" as const,
				key: e.key,
				code: e.code,
				shiftKey: e.shiftKey,
				ctrlKey: e.ctrlKey,
				metaKey: e.metaKey,
				altKey: e.altKey,
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
