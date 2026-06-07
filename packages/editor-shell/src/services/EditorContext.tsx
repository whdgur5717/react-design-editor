import type { EditorSnapshot } from "@design-editor/core"
import { createContext, type PropsWithChildren, useContext, useEffect, useSyncExternalStore } from "react"

import type { EditorApi } from "./Editor"

const EditorContext = createContext<EditorApi | null>(null)

interface EditorContextProviderProps {
	editor: EditorApi
}

export function EditorContextProvider({ editor, children }: PropsWithChildren<EditorContextProviderProps>) {
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

type EditorStateSelector<T> = (snapshot: EditorSnapshot) => T

export function useEditorState<T>(selector: EditorStateSelector<T>): T {
	const editor = useEditor()
	const snapshot = useSyncExternalStore(
		(listener) => editor.state.subscribe(listener),
		() => editor.state.getSnapshot(),
		() => editor.state.getSnapshot(),
	)
	return selector(snapshot)
}
