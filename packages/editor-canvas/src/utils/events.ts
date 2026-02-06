import type { CanvasKeyEvent } from "@design-editor/core"

export function toCanvasKeyEvent(e: KeyboardEvent, type: CanvasKeyEvent["type"]) {
	return {
		type,
		key: e.key,
		code: e.code,
		shiftKey: e.shiftKey,
		ctrlKey: e.ctrlKey,
		metaKey: e.metaKey,
		altKey: e.altKey,
	}
}
