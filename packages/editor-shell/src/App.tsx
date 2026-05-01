import type { CanvasMethods, NodeRect } from "@design-editor/core"
import type { AsyncMethodReturns } from "penpal"
import { connectToChild } from "penpal"
import { useEffect, useRef, useState } from "react"

import { CanvasView } from "./components/CanvasView"
import { Editor } from "./services/Editor"
import { EditorProvider } from "./services/EditorContext"

export function App() {
	const [editor] = useState(() => new Editor())
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
					editor.applyTextChangeFromCanvas(nodeId, content)
				},
				onNodeRectsUpdated(rects: Record<string, NodeRect>) {
					editor.setNodeRectsCache(rects)
				},
			},
		})

		canvasConnection.promise.then((child) => {
			canvasRefLatest.current = child
			editor.attachCanvas(child)
		})

		const unsubscribe = editor.subscribeCanvasSync()

		return () => {
			iframe.src = "about:blank"
			unsubscribe()
			canvasConnection.destroy()
			editor.detachCanvas()
		}
	}, [editor])

	return (
		<EditorProvider value={editor}>
			<CanvasView />
		</EditorProvider>
	)
}
