import type { CSSProperties } from "react"

import type { EditorTool } from "./editor"
import type { ComponentDefinition, DocumentNode } from "./node"

/**
 * Shell → Canvas 상태 동기화 페이로드
 */
export interface SyncStatePayload {
	document: DocumentNode
	currentPageId: string
	components: ComponentDefinition[]
	zoom: number
	selection: string[]
	activeTool: EditorTool
	cursor: CSSProperties["cursor"]
}

export interface NodeRect {
	x: number
	y: number
	width: number
	height: number
}

/**
 * Shell에서 Canvas로 호출 가능한 메서드
 */
export interface CanvasMethods {
	syncState: (state: SyncStatePayload) => void
	hitTest: (x: number, y: number) => string | null
	getNodeRect: (nodeId: string) => NodeRect | null
	getNodeRects: () => Record<string, NodeRect>
}

/**
 * Canvas에서 Shell로 호출 가능한 메서드
 */
export interface ShellMethods {
	onTextChange: (nodeId: string, content: unknown) => void
	onNodeRectsUpdated: (rects: Record<string, NodeRect>) => void
}
