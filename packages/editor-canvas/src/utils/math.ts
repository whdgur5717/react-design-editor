export function adjustDeltaForZoom(delta: { x: number; y: number }, zoom: number) {
	return { x: delta.x / zoom, y: delta.y / zoom }
}
