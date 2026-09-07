import type { DocumentNode } from "@open-editor-sdk/core"

import { createInitialEditorModel } from "../store/editor"
import type { DocumentSessionRepository } from "./EditorStateRepository"
import type { HistoryService } from "./HistoryService"

export class DocumentSessionService {
	constructor(
		private readonly repository: DocumentSessionRepository,
		private readonly history: HistoryService,
	) {}

	loadDocument(document: DocumentNode, currentPageId: string) {
		this.repository.loadDocument(document, currentPageId)
		this.history.clear()
	}

	setCurrentPage(pageId: string) {
		this.repository.setCurrentPage(pageId)
	}

	resetDocument() {
		const initial = createInitialEditorModel()
		this.repository.loadDocument(initial.document, initial.currentPageId)
		this.history.clear()
	}
}
