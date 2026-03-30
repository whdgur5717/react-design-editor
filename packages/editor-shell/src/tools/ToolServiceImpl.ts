import type { EditorTool, PageNode, Position, SceneNode } from "@design-editor/core"

import type { CommandHistory } from "../commands/CommandHistory"
import type { EditorReceiverImpl } from "../commands/EditorReceiverImpl"
import { AddNodeCommand } from "../commands/node/AddNodeCommand"
import { MoveNodeCommand } from "../commands/node/MoveNodeCommand"
import { ReparentNodeCommand } from "../commands/node/ReparentNodeCommand"
import type { Command } from "../commands/types"
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

	getCurrentPage(): PageNode | null {
		return this.receiver.getCurrentPage()
	}

	getActiveTool(): EditorTool {
		return this.store.getState().activeTool
	}

	setActiveTool(tool: EditorTool) {
		this.store.getState().setActiveTool(tool)
	}

	executeAddNode(parentId: string, node: SceneNode, index?: number) {
		this.commandHistory.execute(new AddNodeCommand(this.receiver, parentId, node, index))
	}

	executeMoveNode(nodeId: string, from: Position, to: Position) {
		this.commandHistory.execute(new MoveNodeCommand(this.receiver, nodeId, from, to))
	}

	executeReparentNode(nodeId: string, newParentId: string) {
		this.commandHistory.execute(new ReparentNodeCommand(this.receiver, nodeId, newParentId))
	}
}
