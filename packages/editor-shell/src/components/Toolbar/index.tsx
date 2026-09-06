import type { EditorTool } from "@open-editor-sdk/core"
import { useSyncExternalStore } from "react"

import { useEditor, useEditorState } from "../../services/EditorContext"

const tools: { id: EditorTool; label: string; icon: string }[] = [
	{ id: "select", label: "Select", icon: "↖" },
	{ id: "frame", label: "Frame", icon: "⬜" },
	{ id: "text", label: "Text", icon: "T" },
	{ id: "shape", label: "Shape", icon: "○" },
]

export function Toolbar() {
	const editor = useEditor()
	const { activeTool, zoom } = useEditorState((snapshot) => ({
		activeTool: snapshot.activeTool,
		zoom: snapshot.zoom,
	}))

	const { canUndo, canRedo } = useSyncExternalStore(
		(listener) => editor.history.subscribe(listener),
		() => editor.history.getSnapshot(),
	)

	return (
		<div className="toolbar">
			<div className="toolbar-left">
				<button
					type="button"
					className="toolbar-button"
					onClick={() => editor.history.undo()}
					disabled={!canUndo}
					title="Undo"
				>
					↶
				</button>
				<button
					type="button"
					className="toolbar-button"
					onClick={() => editor.history.redo()}
					disabled={!canRedo}
					title="Redo"
				>
					↷
				</button>
				<div className="toolbar-separator" />
				{tools.map((tool) => (
					<button
						type="button"
						key={tool.id}
						className={`toolbar-button ${activeTool === tool.id ? "active" : ""}`}
						onClick={() => editor.tools.setActiveTool(tool.id)}
						title={tool.label}
					>
						{tool.icon}
					</button>
				))}
			</div>
			<div className="toolbar-right">
				<button
					type="button"
					className="toolbar-button"
					onClick={() => editor.viewport.setZoom(zoom - 0.1)}
					title="Zoom Out"
				>
					−
				</button>
				<span className="zoom-level">{Math.round(zoom * 100)}%</span>
				<button
					type="button"
					className="toolbar-button"
					onClick={() => editor.viewport.setZoom(zoom + 0.1)}
					title="Zoom In"
				>
					+
				</button>
			</div>
		</div>
	)
}
