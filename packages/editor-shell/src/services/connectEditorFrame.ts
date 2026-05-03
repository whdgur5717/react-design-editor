import type { CanvasMethods, NodeRect } from "@design-editor/core"
import { connectToChild } from "penpal"

import type { Editor } from "./Editor"

export function connectEditorFrame(editor: Editor, iframe: HTMLIFrameElement) {
	let disposed = false

	const connection = connectToChild<CanvasMethods>({
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

	connection.promise.then((child) => {
		if (disposed) return
		editor.attachCanvas(child)
	})

	const unsubscribe = editor.subscribeCanvasSync()

	return () => {
		disposed = true
		unsubscribe()
		connection.destroy()
		editor.detachCanvas()
	}
}
