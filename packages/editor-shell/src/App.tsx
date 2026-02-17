import type { CanvasMethods, NodeRect, TextChangePayload } from "@design-editor/core"
import type { AsyncMethodReturns } from "penpal"
import { connectToChild } from "penpal"
import { useEffect, useRef, useState } from "react"
import { shallow } from "zustand/shallow"

import { UpdateNodeCommand } from "./commands"
import { LayersPanel } from "./components/LayersPanel"
import { ToolManagerOverlay } from "./components/overlay"
import { PropertiesPanel } from "./components/PropertiesPanel"
import { Toolbar } from "./components/Toolbar"
import { EditorProvider } from "./services/EditorContext"
import { EditorService } from "./services/EditorService"

export function App() {
	const [editor] = useState(() => new EditorService())
	const canvasRefLatest = useRef<AsyncMethodReturns<CanvasMethods> | null>(null)

	useEffect(() => {
		editor.start()
		return () => editor.dispose()
	}, [editor])

	useEffect(() => {
		const iframe = document.getElementById("canvas-iframe") as HTMLIFrameElement | null
		if (!iframe) return

		iframe.src = import.meta.env.VITE_CANVAS_URL ?? "http://localhost:3001"

		const canvasConnection = connectToChild<CanvasMethods>({
			iframe,
			methods: {
				onTextChange(nodeId: string, content: unknown) {
					const currentNode = editor.receiver.findNode(nodeId)
					if (currentNode?.type === "text") {
						const command = new UpdateNodeCommand(editor.receiver, nodeId, {
							content: content as TextChangePayload["content"],
						})
						editor.commandHistory.execute(command)
					}
				},
				onNodeRectsUpdated(rects: Record<string, NodeRect>) {
					editor.store.getState().setNodeRectsCache(rects)
				},
			},
		})

		canvasConnection.promise.then((child) => {
			canvasRefLatest.current = child
			editor.setCanvas(child)
			editor.syncToCanvas()
		})

		// store 변경 시 Canvas에 동기화 (nodeRectsCache 변경은 무시)
		const unsubscribe = editor.store.subscribe(
			(s) => [s.document, s.currentPageId, s.components, s.zoom, s.selection, s.activeTool] as const,
			() => editor.syncToCanvas(),
			{ equalityFn: shallow },
		)

		// 포인터 이벤트
		const eventTarget = document.getElementById("canvas-event-target")
		if (!eventTarget) return

		const onPointerDown = (e: PointerEvent) => {
			e.preventDefault()
			editor.sendPointerDown({
				clientX: e.clientX,
				clientY: e.clientY,
				pointerId: e.pointerId,
				shiftKey: e.shiftKey,
				metaKey: e.metaKey,
				target: e.target as HTMLElement,
			})
		}

		const onPointerMove = (e: PointerEvent) => {
			editor.sendPointerMove({
				clientX: e.clientX,
				clientY: e.clientY,
			})
		}

		const onPointerUp = (e: PointerEvent) => {
			editor.sendPointerUp({
				clientX: e.clientX,
				clientY: e.clientY,
				shiftKey: e.shiftKey,
				metaKey: e.metaKey,
			})
		}

		eventTarget.addEventListener("pointerdown", onPointerDown)
		eventTarget.addEventListener("pointermove", onPointerMove)
		eventTarget.addEventListener("pointerup", onPointerUp)

		// 키보드 이벤트
		const onKeyDown = (e: KeyboardEvent) => {
			editor.sendKeyDown({
				key: e.key,
				code: e.code,
				shiftKey: e.shiftKey,
				ctrlKey: e.ctrlKey,
				metaKey: e.metaKey,
				altKey: e.altKey,
				target: e.target as HTMLElement,
			})
		}
		window.addEventListener("keydown", onKeyDown, { capture: true })

		return () => {
			iframe.src = "about:blank"
			unsubscribe()
			canvasConnection.destroy()
			editor.setCanvas(null)
			eventTarget.removeEventListener("pointerdown", onPointerDown)
			eventTarget.removeEventListener("pointermove", onPointerMove)
			eventTarget.removeEventListener("pointerup", onPointerUp)
			window.removeEventListener("keydown", onKeyDown, { capture: true })
		}
	}, [editor])

	return (
		<EditorProvider value={editor}>
			<div className="app">
				{/* 1. Canvas 레이어: 이벤트 타겟 + 오버레이 */}
				<div>
					<div id="canvas-event-target" className="canvas-event-target">
						<div className="canvas-area" />
						<ToolManagerOverlay />
					</div>
				</div>

				{/* 2. UI 패널들 */}
				<div>
					<Toolbar />
					<LayersPanel />
					<PropertiesPanel />
				</div>
			</div>
		</EditorProvider>
	)
}
