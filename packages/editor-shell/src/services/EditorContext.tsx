import { createContext, type PropsWithChildren, useContext, useEffect } from "react"
import { useStore } from "zustand"
import { useShallow } from "zustand/react/shallow"

import type { Editor } from "./Editor"

const EditorContext = createContext<Editor | null>(null)

interface EditorProviderProps {
	editor: Editor
}

export function EditorProvider({ editor, children }: PropsWithChildren<EditorProviderProps>) {
	useEffect(() => {
		editor.start()
		return () => editor.dispose()
	}, [editor])

	return <EditorContext.Provider value={editor}>{children}</EditorContext.Provider>
}

export function useEditor() {
	const editor = useContext(EditorContext)
	if (!editor) throw new Error("useEditor must be used within EditorProvider")
	return editor
}

type EditorStateSelector<T> = (editor: Editor) => T

export function useEditorState<T>(selector: EditorStateSelector<T>): T {
	const editor = useEditor()
	return useStore(
		editor.store,
		useShallow(() => selector(editor)),
	)
}
