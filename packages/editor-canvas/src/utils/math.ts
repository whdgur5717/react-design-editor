import type { Position } from "@design-editor/core"

export function adjustDeltaForZoom(delta: Position, zoom: number) {
	return { x: delta.x / zoom, y: delta.y / zoom }
}
