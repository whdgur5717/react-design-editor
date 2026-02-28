import { useState } from "react"

import { useView } from "../../hooks/useView"
import { useEditor } from "../../services/EditorContext"

export function CodeEditorHeader({ componentId, componentName }: { componentId: string; componentName: string }) {
	const [, setUrlState] = useView()
	const editor = useEditor()

	const [nameEditing, setNameEditing] = useState(false)
	const [nameValue, setNameValue] = useState("")

	const startEditing = () => {
		setNameValue(componentName)
		setNameEditing(true)
	}

	const handleNameCommit = () => {
		setNameEditing(false)
		if (nameValue.trim() && nameValue !== componentName) {
			editor.store.getState().updateCodeComponent(componentId, { name: nameValue.trim() })
		}
	}

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				padding: "8px 12px",
				borderBottom: "1px solid #333",
				background: "#252526",
			}}
		>
			<button
				onClick={() => setUrlState({ edit: null })}
				style={{
					background: "none",
					border: "none",
					color: "#ccc",
					cursor: "pointer",
					fontSize: 14,
					padding: "4px 8px",
				}}
			>
				← Back
			</button>
			{nameEditing ? (
				<input
					value={nameValue}
					onChange={(e) => setNameValue(e.target.value)}
					onBlur={handleNameCommit}
					onKeyDown={(e) => e.key === "Enter" && handleNameCommit()}
					autoFocus
					style={{
						background: "#333",
						border: "1px solid #555",
						color: "#fff",
						padding: "2px 6px",
						borderRadius: 3,
						fontSize: 13,
					}}
				/>
			) : (
				<span onDoubleClick={startEditing} style={{ color: "#4ec9b0", fontSize: 13, cursor: "pointer" }}>
					{componentName}
				</span>
			)}
		</div>
	)
}
