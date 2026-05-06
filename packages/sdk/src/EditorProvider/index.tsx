import type { Editor } from "@design-editor/shell"
import { EditorProvider as ShellEditorProvider } from "@design-editor/shell"
import type { PropsWithChildren } from "react"

interface EditorProviderProps {
	editor: Editor
}

export function EditorProvider({ editor, children }: PropsWithChildren<EditorProviderProps>) {
	return <ShellEditorProvider editor={editor}>{children}</ShellEditorProvider>
}
