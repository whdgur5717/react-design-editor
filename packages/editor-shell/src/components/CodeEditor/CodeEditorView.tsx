import { useCodeDraft } from "../../hooks/useCodeDraft"
import { CodeEditorHeader } from "./CodeEditorHeader"
import { CodeEditor } from "./MonacoEditor"
import { PreviewPanel } from "./PreviewPanel"

export function ComponentCodeEditor({ componentId }: { componentId: string }) {
	const { component, draft, setDraft, save, isCompiling, error, previewCode, previewVersion } = useCodeDraft(componentId)

	if (!component) {
		return <div style={{ padding: 16 }}>Component not found</div>
	}

	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				display: "flex",
				flexDirection: "column",
				background: "#1e1e1e",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					borderBottom: "1px solid #333",
				}}
			>
				<CodeEditorHeader componentId={componentId} componentName={component.name} />
				<div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px" }}>
					{error && (
						<span
							style={{
								color: "#f44",
								fontSize: 11,
								maxWidth: 300,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							Error
						</span>
					)}
					{isCompiling && <span style={{ color: "#888", fontSize: 11 }}>Compiling...</span>}
					<button
						onClick={save}
						disabled={isCompiling}
						style={{
							background: "#0e639c",
							border: "none",
							color: "#fff",
							cursor: isCompiling ? "default" : "pointer",
							fontSize: 12,
							padding: "4px 12px",
							borderRadius: 3,
							opacity: isCompiling ? 0.6 : 1,
						}}
					>
						Save (⌘S)
					</button>
				</div>
			</div>
			<div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
				<CodeEditor code={draft} onChange={setDraft} error={error} onSave={save} />
				<PreviewPanel compiledCode={previewCode} previewVersion={previewVersion} />
			</div>
		</div>
	)
}
