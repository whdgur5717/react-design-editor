import type { CanvasMethods, NodeRect, TextChangePayload } from "@design-editor/core"
import type { AsyncMethodReturns } from "penpal"
import { connectToChild } from "penpal"
import { useEffect, useRef, useState } from "react"
import { shallow } from "zustand/shallow"

import { UpdateNodeCommand } from "./commands"
import { CanvasView } from "./components/CanvasView"
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
			(s) =>
				[
					s.document,
					s.currentPageId,
					s.components,
					s.codeComponents,
					s.zoom,
					s.panX,
					s.panY,
					s.selection,
					s.activeTool,
				] as const,
			() => editor.syncToCanvas(),
			{ equalityFn: shallow },
		)

		return () => {
			iframe.src = "about:blank"
			unsubscribe()
			canvasConnection.destroy()
			editor.setCanvas(null)
		}
	}, [editor])

	return (
		<EditorProvider value={editor}>
			<CanvasView />
		</EditorProvider>
	)
}
