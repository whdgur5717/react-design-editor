// ========== Command Pattern ==========
export { CommandHistory } from "./CommandHistory"
export { CompositeCommand } from "./CompositeCommand"
export { EditorReceiverImpl } from "./EditorReceiverImpl"
export type { Command, EditorReceiver, InstanceOverrides, NodeLocation } from "./types"

// ========== Node Commands ==========
export * from "./node"

// ========== 싱글톤 인스턴스 (Composition Root) ==========
import { useEditorStore } from "../store/editor"
import { CommandHistory } from "./CommandHistory"
import { EditorReceiverImpl } from "./EditorReceiverImpl"

export const receiver = new EditorReceiverImpl(useEditorStore)
export const commandHistory = new CommandHistory(50)

// ========== Shortcut Registry ==========
export { registerHistoryShortcuts } from "./historyShortcuts"
export { registerNodeShortcuts } from "./nodeShortcuts"
export { registerSelectionShortcuts } from "./selectionShortcuts"
export { shortcutRegistry } from "./ShortcutRegistry"
// registerToolShortcuts는 순환 참조 방지를 위해 App.tsx에서 직접 import

import { registerHistoryShortcuts } from "./historyShortcuts"
import { registerNodeShortcuts } from "./nodeShortcuts"
import { registerSelectionShortcuts } from "./selectionShortcuts"

export function registerAllShortcuts() {
	registerHistoryShortcuts()
	registerNodeShortcuts()
	registerSelectionShortcuts()
	// registerToolShortcuts는 App.tsx에서 별도 호출
}
