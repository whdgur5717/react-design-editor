import type { CSSProperties } from "react"

import type { CanvasKeyEvent, CanvasPointerEvent, DragEndEvent } from "../events"

export type { DragEndEvent }

/**
 * Tool 인터페이스 - Strategy 패턴
 */
export interface Tool {
	/** Tool 이름 */
	name: string

	/** 마우스 커서 스타일 */
	cursor: CSSProperties["cursor"]

	/** Tool 활성화 시 호출 */
	onActivate(): void

	/** Tool 비활성화 시 호출 */
	onDeactivate(): void

	/** 포인터 다운 이벤트 */
	onPointerDown(e: CanvasPointerEvent): void

	/** 포인터 이동 이벤트 */
	onPointerMove(e: CanvasPointerEvent): void

	/** 포인터 업 이벤트 */
	onPointerUp(e: CanvasPointerEvent): void

	/** 드래그 종료 이벤트 (Canvas 로컬 드래그 완료 시) */
	onDragEnd(e: DragEndEvent): void

	/** 키보드 이벤트 (Tool-specific 처리) */
	onKeyDown(e: CanvasKeyEvent): void
}

/**
 * Tool 기본 구현 (빈 메서드)
 */
export abstract class BaseTool implements Tool {
	abstract name: string
	cursor: CSSProperties["cursor"] = "default"

	onActivate(): void {}
	onDeactivate(): void {}
	onPointerDown(_e: CanvasPointerEvent): void {}
	onPointerMove(_e: CanvasPointerEvent): void {}
	onPointerUp(_e: CanvasPointerEvent): void {}
	onDragEnd(_e: DragEndEvent): void {}
	onKeyDown(_e: CanvasKeyEvent): void {}
}
