import type { EditorTool } from "@design-editor/core"
import { useSyncExternalStore } from "react"

import { useEditorState } from "../../services/EditorContext"

const tools: { id: EditorTool; label: string; icon: string }[] = [
	{ id: "select", label: "Select", icon: "↖" },
	{ id: "frame", label: "Frame", icon: "⬜" },
	{ id: "text", label: "Text", icon: "T" },
	{ id: "shape", label: "Shape", icon: "○" },
]

export function Toolbar() {
	const { editor, activeTool, zoom } = useEditorState((editor) => ({
		editor,
		activeTool: editor.getActiveTool(),
		zoom: editor.getZoom(),
	}))

	const { canUndo, canRedo } = useSyncExternalStore(
		(listener) => editor.subscribeHistory(listener),
		() => editor.getHistorySnapshot(),
	)

	return (
		<div className="toolbar">
			<div className="toolbar-left">
				<button type="button" className="toolbar-button" onClick={() => editor.undo()} disabled={!canUndo} title="Undo">
					↶
				</button>
				<button type="button" className="toolbar-button" onClick={() => editor.redo()} disabled={!canRedo} title="Redo">
					↷
				</button>
				<div className="toolbar-separator" />
				{tools.map((tool) => (
					<button
						type="button"
						key={tool.id}
						className={`toolbar-button ${activeTool === tool.id ? "active" : ""}`}
						onClick={() => editor.setActiveTool(tool.id)}
						title={tool.label}
					>
						{tool.icon}
					</button>
				))}
			</div>
			<div className="toolbar-right">
				<button type="button" className="toolbar-button" onClick={() => editor.setZoom(zoom - 0.1)} title="Zoom Out">
					−
				</button>
				<span className="zoom-level">{Math.round(zoom * 100)}%</span>
				<button type="button" className="toolbar-button" onClick={() => editor.setZoom(zoom + 0.1)} title="Zoom In">
					+
				</button>
			</div>
		</div>
	)
}
