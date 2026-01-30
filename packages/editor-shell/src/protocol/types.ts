import type { ComponentDefinition, DocumentNode, EditorTool } from "@design-editor/core"

import type { CanvasKeyEvent, CanvasPointerEvent } from "../events"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any

/**
 * Shell에서 Canvas로 호출 가능한 메서드
 */
export interface CanvasMethods {
	[key: string]: AnyFunction
	/** 전체 상태 동기화 */
	syncState: (state: {
		document: DocumentNode
		currentPageId: string
		components: ComponentDefinition[]
		zoom: number
		selection: string[]
		activeTool: EditorTool
	}) => void
}

/**
 * Canvas에서 Shell로 호출 가능한 메서드
 */
export interface ShellMethods {
	[key: string]: AnyFunction

	// 이벤트 시스템 메서드
	onCanvasPointerEvent: (event: CanvasPointerEvent) => void
	onCanvasKeyEvent: (event: CanvasKeyEvent) => void
}
