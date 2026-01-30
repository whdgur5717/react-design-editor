export { commandRegistry } from "./CommandRegistry"
export { registerHistoryCommands } from "./history"
export { registerNodeCommands } from "./node"
export { registerSelectionCommands } from "./selection"
export { registerToolCommands } from "./tool"
export type { Command, CommandHandler } from "./types"

import { registerHistoryCommands } from "./history"
import { registerNodeCommands } from "./node"
import { registerSelectionCommands } from "./selection"
import { registerToolCommands } from "./tool"

/**
 * 모든 기본 Command 등록
 */
export function registerAllCommands(): void {
	registerHistoryCommands()
	registerNodeCommands()
	registerSelectionCommands()
	registerToolCommands()
}
