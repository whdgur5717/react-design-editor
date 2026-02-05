import type { EditorTool, SceneNode } from "@design-editor/core"

import type { Command, CommandHistory, EditorReceiver } from "../commands"
import type { useEditorStore } from "../store/editor"
import type { ToolService } from "./ToolService"

/**
 * ToolServiceImpl - ToolService 구현체
 */
export class ToolServiceImpl implements ToolService {
	constructor(
		private store: typeof useEditorStore,
		private commandHistory: CommandHistory,
		private receiver: EditorReceiver,
	) {}

	getSelection(): string[] {
		return this.store.getState().selection
	}

	setSelection(ids: string[]): void {
		this.store.getState().setSelection(ids)
	}

	toggleSelection(id: string): void {
		this.store.getState().toggleSelection(id)
	}

	executeCommand(command: Command): void {
		this.commandHistory.execute(command)
	}

	beginTransaction(): void {
		this.commandHistory.beginTransaction()
	}

	commitTransaction(): void {
		this.commandHistory.commitTransaction()
	}

	findNode(id: string): SceneNode | null {
		return this.receiver.findNode(id)
	}

	findNodeLocation(id: string): { parentId: string; index: number } | null {
		return this.receiver.findNodeLocation(id)
	}

	getCurrentPageId(): string {
		return this.receiver.getCurrentPageId()
	}

	getActiveTool(): EditorTool {
		return this.store.getState().activeTool
	}

	setActiveTool(tool: EditorTool): void {
		this.store.getState().setActiveTool(tool)
	}

	getReceiver(): EditorReceiver {
		return this.receiver
	}
}
