import type { EditorTool } from "@open-editor-sdk/core"

import type { ActionHandler } from "../commands/ActionRegistry"
import type { EditorAction } from "../keybindings"
import type { Keybinding } from "../keybindings/types"
import type { ClipboardService } from "../services/ClipboardService"
import type { DocumentService } from "../services/DocumentService"
import type { HistoryService } from "../services/HistoryService"
import type { SelectionService } from "../services/SelectionService"
import type { ToolFacade } from "../tools/ToolFacade"
import type { Tool } from "../tools/types"

export interface EditorExtensionContext {
	toolFacade: ToolFacade
	services: {
		clipboard: ClipboardService
		document: DocumentService
		selection: SelectionService
		history: HistoryService
	}
}

export interface ToolContribution {
	id: EditorTool
	tool: Tool
}

export interface ActionContribution {
	id: EditorAction
	handler: ActionHandler
}

export interface EditorExtension {
	tools?(context: EditorExtensionContext): ToolContribution[]
	actions?(context: EditorExtensionContext): ActionContribution[]
	keybindings?: readonly Keybinding[]
}
