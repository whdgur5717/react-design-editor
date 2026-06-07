import type { NodeRect } from "@design-editor/core"

import { hitTestNodeIdInPage } from "../document/hitTest"
import type { DocumentReadRepository, GeometryRepository, ViewportRepository } from "./EditorStateRepository"

export class GeometryService {
	constructor(
		private readonly geometry: GeometryRepository,
		private readonly document: DocumentReadRepository,
		private readonly viewport: ViewportRepository,
	) {}

	getNodeRectsCache() {
		return this.geometry.getNodeRectsCache()
	}

	setNodeRectsCache(rects: Record<string, NodeRect>) {
		this.geometry.setNodeRectsCache(rects)
	}

	getNodeRenderedRect(nodeId: string) {
		return this.geometry.getNodeRenderedRect(nodeId)
	}

	hitTestNodeId(clientX: number, clientY: number) {
		const page = this.document.getCurrentPage()
		if (!page) return null
		const { x: panX, y: panY } = this.viewport.getPan()
		return hitTestNodeIdInPage(
			page,
			this.geometry.getNodeRectsCache(),
			this.viewport.getZoom(),
			panX,
			panY,
			clientX,
			clientY,
		)
	}
}
