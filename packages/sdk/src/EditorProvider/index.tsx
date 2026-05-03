import type { PropsWithChildren } from "react"
import { EditorProvider as ShellEditorProvider } from "@design-editor/shell"
import type { Editor } from "@design-editor/shell"

interface EditorProviderProps {
	editor: Editor
}

export function EditorProvider({ editor, children }: PropsWithChildren<EditorProviderProps>) {
	return <ShellEditorProvider editor={editor}>{children}</ShellEditorProvider>
}
