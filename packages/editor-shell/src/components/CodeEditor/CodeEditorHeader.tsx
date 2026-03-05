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
				borderBottom: "1px solid #e0e0e0",
				background: "#ffffff",
			}}
		>
			<button
				onClick={() => setUrlState({ edit: null })}
				style={{
					background: "none",
					border: "none",
					color: "#666",
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
						background: "#f0f0f0",
						border: "1px solid #ddd",
						color: "#1a1a1a",
						padding: "2px 6px",
						borderRadius: 3,
						fontSize: 13,
					}}
				/>
			) : (
				<span onDoubleClick={startEditing} style={{ color: "#0d99ff", fontSize: 13, cursor: "pointer" }}>
					{componentName}
				</span>
			)}
		</div>
	)
}
