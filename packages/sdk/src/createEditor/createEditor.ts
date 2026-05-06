import { Editor } from "@design-editor/shell"

import { type EditorComponentRegistrationMap, registerEditorComponents } from "./componentRegistration"

export interface CreateEditorOptions {
	components?: EditorComponentRegistrationMap
}

export function createEditor(options: CreateEditorOptions = {}) {
	const editor = new Editor()
	registerEditorComponents(editor, options.components ?? {})
	return editor
}
