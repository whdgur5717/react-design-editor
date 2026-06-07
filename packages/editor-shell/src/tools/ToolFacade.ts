import type { EditorTool, PageNode, Position, SceneNode } from "@design-editor/core"

import type { Command } from "../commands/types"

/**
 * ToolFacade - Tool이 editor subsystem을 쓰기 위한 단순화된 인터페이스
 */
export interface ToolFacade {
	// Selection
	getSelection(): string[]
	setSelection(ids: string[]): void
	toggleSelection(id: string): void

	// Command 실행
	executeCommand(command: Command): void
	beginTransaction(): void
	commitTransaction(): void

	// Query
	findNode(id: string): SceneNode | null
	findNodeLocation(id: string): { parentId: string; index: number } | null
	getCurrentPageId(): string
	getCurrentPage(): PageNode | null

	// Tool 상태
	getActiveTool(): EditorTool
	setActiveTool(tool: EditorTool): void

	executeAddNode(parentId: string, node: SceneNode, index?: number): void
	executeMoveNode(nodeId: string, from: Position, to: Position): void
	executeReparentNode(nodeId: string, newParentId: string): void
}
