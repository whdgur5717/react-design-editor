import { useView } from "../../hooks/useView"
import { useEditor, useEditorStore } from "../../services/EditorContext"

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

	const handleNewComponent = () => {
		const id = editor.createCodeComponent("New Component", DEFAULT_SOURCE)
		setUrlState({ edit: id })
	}

	const handleEditComponent = (id: string) => {
		setUrlState({ edit: id })
	}

	const handleAddInstance = (e: React.MouseEvent, componentId: string) => {
		e.stopPropagation()
		editor.addCodeComponentInstanceToCurrentPage(componentId)
		setUrlState({ edit: null })
	}

	const handleRemoveComponent = (e: React.MouseEvent, id: string) => {
		e.stopPropagation()
		editor.removeCodeComponent(id)
	}

	return (
		<div className="components-panel">
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px" }}>
				<span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#999" }}>Code Components</span>
				<button
					type="button"
					onClick={handleNewComponent}
					style={{
						background: "none",
						border: "1px solid #ddd",
						borderRadius: 4,
						padding: "2px 8px",
						cursor: "pointer",
						fontSize: 11,
						color: "#666",
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
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							padding: "6px 8px",
							borderRadius: 4,
							fontSize: 12,
						}}
					>
						<button
							type="button"
							onClick={() => handleEditComponent(comp.id)}
							style={{
								background: "none",
								border: "none",
								padding: 0,
								margin: 0,
								cursor: "pointer",
								font: "inherit",
								color: "inherit",
							}}
							title="Edit component"
						>
							<span style={{ display: "flex", alignItems: "center", gap: 6 }}>
								<span style={{ color: comp.compiledCode ? "#0d99ff" : "#bbb" }}>{"<>"}</span>
								{comp.name}
								{comp.compilationError && <span style={{ color: "#f44" }}>!</span>}
							</span>
						</button>
						<span style={{ display: "flex", gap: 4 }}>
							<button
								type="button"
								onClick={(e) => handleAddInstance(e, comp.id)}
								disabled={!comp.compiledCode}
								style={{
									background: "none",
									border: "none",
									cursor: comp.compiledCode ? "pointer" : "default",
									fontSize: 14,
									padding: "0 4px",
									color: comp.compiledCode ? "#666" : "#ccc",
								}}
								title="Add instance to canvas"
							>
								+
							</button>
							<button
								type="button"
								onClick={(e) => handleRemoveComponent(e, comp.id)}
								style={{
									background: "none",
									border: "none",
									cursor: "pointer",
									fontSize: 14,
									padding: "0 4px",
									color: "#999",
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
