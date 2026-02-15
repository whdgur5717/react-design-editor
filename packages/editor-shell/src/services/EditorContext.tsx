import type { EditorStore } from "@design-editor/core"
import { createContext, useContext } from "react"
import { useStore } from "zustand"

import type { EditorService } from "./EditorService"

const EditorContext = createContext<EditorService | null>(null)

export const EditorProvider = EditorContext.Provider

export function useEditor() {
	const editor = useContext(EditorContext)
	if (!editor) throw new Error("useEditor must be used within EditorProvider")
	return editor
}

export function useEditorStore<T>(selector: (state: EditorStore) => T): T {
	const editor = useEditor()
	return useStore(editor.store, selector)
}
