import { defaultKeybindings } from "../keybindings"
import { FrameTool } from "../tools/FrameTool"
import { SelectTool } from "../tools/SelectTool"
import { TextTool } from "../tools/TextTool"
import type { EditorExtension } from "./types"

export function createBuiltinEditorExtension(): EditorExtension {
	return {
		tools: ({ toolFacade }) => [
			{ id: "select", tool: new SelectTool(toolFacade) },
			{ id: "frame", tool: new FrameTool(toolFacade) },
			{ id: "text", tool: new TextTool(toolFacade) },
		],
		actions: ({ services, toolFacade }) => [
			{ id: "history:undo", handler: () => services.history.undo() },
			{ id: "history:redo", handler: () => services.history.redo() },
			{ id: "selection:clear", handler: () => services.selection.clearSelection() },
			{ id: "selection:all", handler: () => services.selection.selectAll() },
			{ id: "node:delete", handler: () => services.document.deleteSelectedNodes() },
			{ id: "node:duplicate", handler: () => services.document.duplicateSelectedNodes() },
			{ id: "clipboard:copy", handler: () => services.clipboard.copy() },
			{ id: "clipboard:cut", handler: () => services.clipboard.cut() },
			{ id: "clipboard:paste", handler: () => services.clipboard.paste() },
			{ id: "tool:select", handler: () => toolFacade.setActiveTool("select") },
			{ id: "tool:frame", handler: () => toolFacade.setActiveTool("frame") },
			{ id: "tool:text", handler: () => toolFacade.setActiveTool("text") },
			{ id: "tool:shape", handler: () => toolFacade.setActiveTool("shape") },
		],
		keybindings: defaultKeybindings,
	}
}
