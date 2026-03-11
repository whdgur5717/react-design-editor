/**
 * 기본 키바인딩 설정
 *
 * as const로 선언하여 EditorAction 타입을 자동 추론한다.
 * 키바인딩을 추가/삭제하면 EditorAction 타입이 자동으로 따라간다.
 */
export const defaultKeybindings = [
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
] as const

/** 키바인딩에 등록된 액션 ID */
type KeyboundAction = (typeof defaultKeybindings)[number]["command"]

/** 키바인딩 없이 등록되는 액션 포함 */
export type EditorAction = KeyboundAction | "selection:all"
