import type { EditorApi } from "@open-editor-sdk/shell"
import { EditorContextProvider } from "@open-editor-sdk/shell"
import type * as React from "react"

export interface EditorProviderProps {
	editor: EditorApi
}

export function EditorProvider({ editor, children }: React.PropsWithChildren<EditorProviderProps>) {
	return <EditorContextProvider editor={editor}>{children}</EditorContextProvider>
}
