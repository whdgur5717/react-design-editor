import type { CodeComponentDefinition } from "@design-editor/core"

import type { EditorStoreApi } from "../store/editor"

type CodeComponentUpdates = Partial<
	Pick<CodeComponentDefinition, "source" | "compiledCode" | "propertyControls" | "compilationError" | "name">
>

export class CodeComponentUsecase {
	constructor(private readonly store: EditorStoreApi) {}

	create(name: string, source: string) {
		return this.store.getState().addCodeComponent(name, source)
	}

	rename(id: string, name: string) {
		this.update(id, { name })
	}

	update(id: string, updates: CodeComponentUpdates) {
		this.store.getState().updateCodeComponent(id, updates)
	}

	remove(id: string) {
		this.store.getState().removeCodeComponent(id)
	}

	addInstanceToCurrentPage(componentId: string) {
		const currentPageId = this.store.getState().currentPageId
		return this.store.getState().createInstance(componentId, currentPageId)
	}
}
