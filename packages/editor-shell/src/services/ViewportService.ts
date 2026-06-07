import type { ViewportRepository } from "./EditorStateRepository"

export class ViewportService {
	constructor(private readonly repository: ViewportRepository) {}

	getZoom() {
		return this.repository.getZoom()
	}

	getPan() {
		return this.repository.getPan()
	}

	setZoom(zoom: number) {
		this.repository.setZoom(zoom)
	}

	setPan(x: number, y: number) {
		this.repository.setPan(x, y)
	}
}
