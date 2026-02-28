import { useView } from "../hooks/useView"
import { useEditor, useEditorStore } from "../services/EditorContext"

const DEFAULT_SOURCE = `import React from "react"

export default function MyComponent({ text = "Hello" }: { text?: string }) {
  return (
    <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
      {text}
    </div>
  )
}

export const propertyControls = {
  text: { type: "string", title: "Text", defaultValue: "Hello" },
}
`

export function ComponentsPanel() {
	const [, setUrlState] = useView()
	const editor = useEditor()
	const codeComponents = useEditorStore((state) => state.codeComponents)
	const currentPageId = useEditorStore((state) => state.currentPageId)

	const handleNewComponent = () => {
		const id = editor.store.getState().addCodeComponent("New Component", DEFAULT_SOURCE)
		setUrlState({ edit: id })
	}

	const handleEditComponent = (id: string) => {
		setUrlState({ edit: id })
	}

	const handleAddInstance = (e: React.MouseEvent, componentId: string) => {
		e.stopPropagation()
		editor.store.getState().createInstance(componentId, currentPageId)
		setUrlState({ edit: null })
	}

	const handleRemoveComponent = (e: React.MouseEvent, id: string) => {
		e.stopPropagation()
		editor.store.getState().removeCodeComponent(id)
	}

	return (
		<div className="components-panel">
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px" }}>
				<span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#888" }}>Code Components</span>
				<button
					onClick={handleNewComponent}
					style={{
						background: "none",
						border: "1px solid #555",
						borderRadius: 4,
						padding: "2px 8px",
						cursor: "pointer",
						fontSize: 11,
						color: "#ccc",
					}}
				>
					+ New
				</button>
			</div>
			<div style={{ padding: "0 4px" }}>
				{codeComponents.length === 0 && (
					<div style={{ padding: "16px 8px", color: "#666", fontSize: 12, textAlign: "center" }}>No code components yet</div>
				)}
				{codeComponents.map((comp) => (
					<div
						key={comp.id}
						onClick={() => handleEditComponent(comp.id)}
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							padding: "6px 8px",
							cursor: "pointer",
							borderRadius: 4,
							fontSize: 12,
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = "#333"
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = "transparent"
						}}
					>
						<span style={{ display: "flex", alignItems: "center", gap: 6 }}>
							<span style={{ color: comp.compiledCode ? "#4ec9b0" : "#888" }}>{"<>"}</span>
							{comp.name}
							{comp.compilationError && <span style={{ color: "#f44" }}>!</span>}
						</span>
						<span style={{ display: "flex", gap: 4 }}>
							<button
								onClick={(e) => handleAddInstance(e, comp.id)}
								disabled={!comp.compiledCode}
								style={{
									background: "none",
									border: "none",
									cursor: comp.compiledCode ? "pointer" : "default",
									fontSize: 14,
									padding: "0 4px",
									color: comp.compiledCode ? "#ccc" : "#555",
								}}
								title="Add instance to canvas"
							>
								+
							</button>
							<button
								onClick={(e) => handleRemoveComponent(e, comp.id)}
								style={{
									background: "none",
									border: "none",
									cursor: "pointer",
									fontSize: 14,
									padding: "0 4px",
									color: "#888",
								}}
								title="Delete component"
							>
								x
							</button>
						</span>
					</div>
				))}
			</div>
		</div>
	)
}
