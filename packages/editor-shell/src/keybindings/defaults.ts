import type { Keybinding } from "./types"

/**
 * 기본 키바인딩 설정
 */
export const defaultKeybindings: Keybinding[] = [
	// History
	{ key: "z", modifiers: { meta: true }, command: "history:undo" },
	{ key: "z", modifiers: { meta: true, shift: true }, command: "history:redo" },

	// Selection
	{ key: "Escape", modifiers: {}, command: "selection:clear" },

	// Node
	{ key: "Backspace", modifiers: {}, command: "node:delete", when: "hasSelection" },
	{ key: "Delete", modifiers: {}, command: "node:delete", when: "hasSelection" },
	{ key: "d", modifiers: { meta: true }, command: "node:duplicate", when: "hasSelection" },

	// Tool 전환
	{ key: "v", modifiers: {}, command: "tool:select" },
	{ key: "f", modifiers: {}, command: "tool:frame" },
	{ key: "t", modifiers: {}, command: "tool:text" },
	{ key: "r", modifiers: {}, command: "tool:shape" },
]
