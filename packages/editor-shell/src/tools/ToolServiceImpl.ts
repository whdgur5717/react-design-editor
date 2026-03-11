import type { EditorTool, SceneNode } from "@design-editor/core"

import type { Command, EditorReceiver } from "../commands"
import type { CommandHistory } from "../commands"
import type { EditorReceiverImpl } from "../commands"
import type { EditorStoreApi } from "../store/editor"
import type { ToolService } from "./ToolService"

/**
 * ToolServiceImpl - 필요한 서브시스템만 받아서 ToolService 인터페이스 제공
 */
export class ToolServiceImpl implements ToolService {
	constructor(
		private readonly store: EditorStoreApi,
		private readonly receiver: EditorReceiverImpl,
		private readonly commandHistory: CommandHistory,
	) {}

	getSelection() {
		return this.store.getState().selection
	}

	setSelection(ids: string[]) {
		this.store.getState().setSelection(ids)
	}

	toggleSelection(id: string) {
		this.store.getState().toggleSelection(id)
	}

	executeCommand(command: Command) {
		this.commandHistory.execute(command)
	}

	beginTransaction() {
		this.commandHistory.beginTransaction()
	}

	commitTransaction() {
		this.commandHistory.commitTransaction()
	}

	findNode(id: string): SceneNode | null {
		return this.receiver.findNode(id)
	}

	findNodeLocation(id: string) {
		return this.receiver.findNodeLocation(id)
	}

	getCurrentPageId() {
		return this.receiver.getCurrentPageId()
	}

	getActiveTool(): EditorTool {
		return this.store.getState().activeTool
	}

	setActiveTool(tool: EditorTool) {
		this.store.getState().setActiveTool(tool)
	}

	getReceiver(): EditorReceiver {
		return this.receiver
	}
}
