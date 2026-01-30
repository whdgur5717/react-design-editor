import type { CanvasKeyEvent, CanvasPointerEvent, DragEndEvent } from "@design-editor/core"

export type { CanvasKeyEvent, CanvasPointerEvent, DragEndEvent }

/**
 * 이벤트 타입 상수
 */
export const EventTypes = {
	// Canvas 포인터 이벤트
	CANVAS_MOUSE_DOWN: "canvas:mousedown",
	CANVAS_MOUSE_MOVE: "canvas:mousemove",
	CANVAS_MOUSE_UP: "canvas:mouseup",
	CANVAS_DRAG_END: "canvas:dragend",

	// Canvas 키보드 이벤트
	CANVAS_KEY_DOWN: "canvas:keydown",
	CANVAS_KEY_UP: "canvas:keyup",

	// Shell 키보드 이벤트
	SHELL_KEY_DOWN: "shell:keydown",
	SHELL_KEY_UP: "shell:keyup",

	// 노드 이벤트
	NODE_SELECT: "node:select",
	NODE_HOVER: "node:hover",
	NODE_MOVE: "node:move",
	NODE_RESIZE: "node:resize",
	NODE_CREATE: "node:create",
	NODE_DELETE: "node:delete",

	// 히스토리 이벤트
	HISTORY_UNDO: "history:undo",
	HISTORY_REDO: "history:redo",

	// Tool 이벤트
	TOOL_CHANGE: "tool:change",
} as const

export type EventType = (typeof EventTypes)[keyof typeof EventTypes]
