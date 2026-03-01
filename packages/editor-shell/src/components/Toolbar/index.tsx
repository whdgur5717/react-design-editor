import "./Toolbar.css"

import type { EditorTool } from "@design-editor/core"
import { useState, useSyncExternalStore } from "react"
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

	const { activeTool, setActiveTool, zoom, setZoom, selection, document, components, createComponent, createInstance } =
		useEditorStore(
			useShallow((state) => ({
				activeTool: state.activeTool,
				setActiveTool: state.setActiveTool,
				zoom: state.zoom,
				setZoom: state.setZoom,
				selection: state.selection,
				document: state.document,
				components: state.components,
				createComponent: state.createComponent,
				createInstance: state.createInstance,
			})),
		)

	const { canUndo, canRedo } = useSyncExternalStore(
		(listener) => editor.commandHistory.subscribe(listener),
		() => editor.commandHistory.getSnapshot(),
	)

	const [showComponentMenu, setShowComponentMenu] = useState(false)

	const canCreateComponent = selection.length === 1 && selection[0] !== document.id

	const handleCreateComponent = () => {
		if (!canCreateComponent) return
		const name = prompt("Component name:")
		if (name) {
			createComponent(selection[0], name)
		}
		setShowComponentMenu(false)
	}

	const handleCreateInstance = (componentId: string) => {
		createInstance(componentId, document.id)
		setShowComponentMenu(false)
	}

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
				<div className="toolbar-separator" />
				<div className="component-menu-container">
					<button className="toolbar-button" onClick={() => setShowComponentMenu(!showComponentMenu)} title="Components">
						◇
					</button>
					{showComponentMenu && (
						<div className="component-menu">
							<button className="menu-item" onClick={handleCreateComponent} disabled={!canCreateComponent}>
								Create Component
							</button>
							{components.length > 0 && (
								<>
									<div className="menu-separator" />
									<div className="menu-label">Insert Instance</div>
									{components.map((comp) => (
										<button key={comp.id} className="menu-item" onClick={() => handleCreateInstance(comp.id)}>
											{comp.name}
										</button>
									))}
								</>
							)}
						</div>
					)}
				</div>
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
