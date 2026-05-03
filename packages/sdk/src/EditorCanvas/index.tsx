import { CanvasInteractionSurface, connectEditorFrame, useEditor } from "@design-editor/shell"
import { useEffect, useRef } from "react"

const canvasFrameSrc = new URL("canvas.html", import.meta.url).href

export function EditorCanvas() {
	const editor = useEditor()
	const iframeRef = useRef<HTMLIFrameElement>(null)

	useEffect(() => {
		const iframe = iframeRef.current
		if (!iframe) return
		return connectEditorFrame(editor, iframe)
	}, [editor])

	return (
		<div className="de-editor-canvas-host" data-design-editor-canvas-host="">
			<iframe
				ref={iframeRef}
				className="de-editor-canvas-frame"
				data-testid="design-editor-canvas-frame"
				title="Design editor canvas"
				src={canvasFrameSrc}
				tabIndex={-1}
				sandbox="allow-scripts allow-same-origin"
			/>
			<CanvasInteractionSurface />
		</div>
	)
}
