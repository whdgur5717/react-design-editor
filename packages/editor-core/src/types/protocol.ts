import type { CSSProperties } from "react"

import type { EditorTool } from "./editor"
import type { CanvasGesture } from "./gesture"
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

/**
 * Shell에서 Canvas로 호출 가능한 메서드
 */
export interface CanvasMethods {
	syncState: (state: SyncStatePayload) => void
}

/**
 * Canvas에서 Shell로 호출 가능한 메서드
 */
export interface ShellMethods {
	onGesture: (gesture: CanvasGesture) => void
}
