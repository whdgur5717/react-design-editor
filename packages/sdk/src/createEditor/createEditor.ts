import { createEditorRuntime, type CreateEditorRuntimeOptions } from "@design-editor/shell"

import { type EditorComponentRegistrationMap, registerEditorComponents } from "./componentRegistration"

export interface CreateEditorOptions extends CreateEditorRuntimeOptions {
	components?: EditorComponentRegistrationMap
}

export function createEditor(options: CreateEditorOptions = {}) {
	const editor = createEditorRuntime({
		store: options.store,
		document: options.document,
		currentPageId: options.currentPageId,
		extensions: options.extensions,
	})
	registerEditorComponents(editor, options.components ?? {})
	return editor
}
