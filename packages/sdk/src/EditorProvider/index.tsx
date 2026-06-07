import type { EditorApi } from "@design-editor/shell"
import { EditorContextProvider } from "@design-editor/shell"
import type * as React from "react"

interface EditorProviderProps {
	editor: EditorApi
}

export function EditorProvider({ editor, children }: React.PropsWithChildren<EditorProviderProps>) {
	return <EditorContextProvider editor={editor}>{children}</EditorContextProvider>
}
