import type { EditorTool, SceneNode } from "@design-editor/core"

import type { Command, EditorReceiver } from "../commands"

/**
 * ToolService - Tool이 필요한 의존성을 추상화한 인터페이스
 */
export interface ToolService {
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

	// Tool 상태
	getActiveTool(): EditorTool
	setActiveTool(tool: EditorTool): void

	// Receiver 접근 (Command 생성용)
	getReceiver(): EditorReceiver
}
