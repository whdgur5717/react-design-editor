import type { SceneNode } from "@open-editor-sdk/core"

import type { DocumentReadRepository, SelectionRepository } from "./EditorStateRepository"

export class SelectionService {
	constructor(
		private readonly repository: SelectionRepository,
		private readonly documentRepository: DocumentReadRepository,
	) {}

	getSelection() {
		return this.repository.getSelection()
	}

	setSelection(ids: string[]) {
		this.repository.setSelection(ids)
	}

	toggleSelection(id: string) {
		this.repository.toggleSelection(id)
	}

	clearSelection() {
		this.repository.setSelection([])
	}

	selectAll() {
		const page = this.documentRepository.getCurrentPage()
		if (!page) return
		this.repository.setSelection(collectAllNodeIds(page.children))
	}

	setHoveredId(id: string | null) {
		this.repository.setHoveredId(id)
	}
}

function collectAllNodeIds(nodes: SceneNode[]) {
	const ids: string[] = []
	for (const node of nodes) {
		ids.push(node.id)
		if ("children" in node && Array.isArray(node.children)) {
			ids.push(...collectAllNodeIds(node.children))
		}
	}
	return ids
}
