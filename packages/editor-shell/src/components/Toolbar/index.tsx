import "./Toolbar.css"

import type { EditorTool } from "@design-editor/core"
import { useSyncExternalStore } from "react"
import { useShallow } from "zustand/react/shallow"

import { useEditor, useEditorStore } from "../../services/EditorContext"

const tools: { id: EditorTool; label: string; icon: string }[] = [
	{ id: "select", label: "Select", icon: "↖" },
	{ id: "frame", label: "Frame", icon: "⬜" },
	{ id: "text", label: "Text", icon: "T" },
	{ id: "shape", label: "Shape", icon: "○" },
]

export function Toolbar() {
	const editor = useEditor()

	const { activeTool, setActiveTool, zoom, setZoom } = useEditorStore(
		useShallow((state) => ({
			activeTool: state.activeTool,
			setActiveTool: state.setActiveTool,
			zoom: state.zoom,
			setZoom: state.setZoom,
		})),
	)

	const { canUndo, canRedo } = useSyncExternalStore(
		(listener) => editor.commandHistory.subscribe(listener),
		() => editor.commandHistory.getSnapshot(),
	)

	return (
		<div className="toolbar">
			<div className="toolbar-left">
				<button className="toolbar-button" onClick={() => editor.commandHistory.undo()} disabled={!canUndo} title="Undo">
					↶
				</button>
				<button className="toolbar-button" onClick={() => editor.commandHistory.redo()} disabled={!canRedo} title="Redo">
					↷
				</button>
				<div className="toolbar-separator" />
				{tools.map((tool) => (
					<button
						key={tool.id}
						className={`toolbar-button ${activeTool === tool.id ? "active" : ""}`}
						onClick={() => setActiveTool(tool.id)}
						title={tool.label}
					>
						{tool.icon}
					</button>
				))}
			</div>
			<div className="toolbar-right">
				<button className="toolbar-button" onClick={() => setZoom(zoom - 0.1)} title="Zoom Out">
					−
				</button>
				<span className="zoom-level">{Math.round(zoom * 100)}%</span>
				<button className="toolbar-button" onClick={() => setZoom(zoom + 0.1)} title="Zoom In">
					+
				</button>
			</div>
		</div>
	)
}
