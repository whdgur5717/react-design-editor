import Editor, { type Monaco } from "@monaco-editor/react"
import { useRef } from "react"

function configureTypeScript(monaco: Monaco) {
	monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
		jsx: monaco.languages.typescript.JsxEmit.React,
		esModuleInterop: true,
		allowSyntheticDefaultImports: true,
		target: monaco.languages.typescript.ScriptTarget.ESNext,
		module: monaco.languages.typescript.ModuleKind.ESNext,
		moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
	})
}

const EDITOR_OPTIONS = {
	minimap: { enabled: false },
	fontSize: 13,
	lineNumbers: "on" as const,
	scrollBeyondLastLine: false,
	automaticLayout: true,
	tabSize: 2,
}

export function CodeEditor({
	code,
	onChange,
	error,
	onSave,
}: {
	code: string
	onChange: (value: string) => void
	error: string | null
	onSave: () => void
}) {
	const onSaveRef = useRef(onSave)
	onSaveRef.current = onSave

	return (
		<div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
			<Editor
				defaultLanguage="typescript"
				defaultPath="component.tsx"
				value={code}
				onChange={(v) => onChange(v ?? "")}
				beforeMount={configureTypeScript}
				onMount={(editorInstance) => {
					editorInstance.addAction({
						id: "save-component",
						label: "Save Component",
						keybindings: [2048 | 49], // CtrlCmd + S
						run: () => onSaveRef.current(),
					})
				}}
				theme="vs-dark"
				options={EDITOR_OPTIONS}
			/>
			{error && (
				<div
					style={{
						padding: "8px 12px",
						background: "#3c1f1f",
						color: "#f88",
						fontSize: 12,
						borderTop: "1px solid #5c2020",
						maxHeight: 120,
						overflow: "auto",
						whiteSpace: "pre-wrap",
						fontFamily: "monospace",
					}}
				>
					{error}
				</div>
			)}
		</div>
	)
}
