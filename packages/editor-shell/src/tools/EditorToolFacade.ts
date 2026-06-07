import type { EditorTool, PageNode, Position, SceneNode } from "@design-editor/core"

import { AddNodeCommand } from "../commands/node/AddNodeCommand"
import { MoveNodeCommand } from "../commands/node/MoveNodeCommand"
import { ReparentNodeCommand } from "../commands/node/ReparentNodeCommand"
import type { Command, DocumentCommandReceiver } from "../commands/types"
import type {
	DocumentReadRepository,
	SelectionRepository,
	ToolStateRepository,
} from "../services/EditorStateRepository"
import type { HistoryService } from "../services/HistoryService"
import type { ToolFacade } from "./ToolFacade"

type ToolFacadeRepository = DocumentReadRepository & SelectionRepository & ToolStateRepository

/**
 * EditorToolFacade - 필요한 서브시스템만 받아서 ToolFacade 인터페이스 제공
 */
export class EditorToolFacade implements ToolFacade {
	constructor(
		private readonly repository: ToolFacadeRepository,
		private readonly receiver: DocumentCommandReceiver,
		private readonly history: HistoryService,
	) {}

	getSelection() {
		return this.repository.getSelection()
	}

	setSelection(ids: string[]) {
		this.repository.setSelection(ids)
	}

	toggleSelection(id: string) {
		this.repository.toggleSelection(id)
	}

	executeCommand(command: Command) {
		this.history.execute(command)
	}

	beginTransaction() {
		this.history.beginTransaction()
	}

	commitTransaction() {
		this.history.commitTransaction()
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
		return this.repository.getActiveTool()
	}

	setActiveTool(tool: EditorTool) {
		this.repository.setActiveTool(tool)
	}

	executeAddNode(parentId: string, node: SceneNode, index?: number) {
		this.history.execute(new AddNodeCommand(this.receiver, parentId, node, index))
	}

	executeMoveNode(nodeId: string, from: Position, to: Position) {
		this.history.execute(new MoveNodeCommand(this.receiver, nodeId, from, to))
	}

	executeReparentNode(nodeId: string, newParentId: string) {
		this.history.execute(new ReparentNodeCommand(this.receiver, nodeId, newParentId))
	}
}
