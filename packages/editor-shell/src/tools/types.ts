import type { ClickPayload, DragPayload, KeyPayload } from "@design-editor/core"
import type { CSSProperties } from "react"

import type { ToolService } from "./ToolService"

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

	/** 클릭 이벤트 */
	onClick(nodeId: string | null, payload: ClickPayload): void

	/** 드래그 종료 이벤트 */
	onDragEnd(nodeId: string | null, payload: DragPayload): void

	/** 키보드 이벤트 */
	onKeyDown(payload: KeyPayload): void
}

/**
 * Tool 기본 구현 - ToolService 의존성 주입
 */
export abstract class BaseTool implements Tool {
	constructor(protected service: ToolService) {}

	abstract name: string
	cursor: CSSProperties["cursor"] = "default"

	onActivate(): void {}
	onDeactivate(): void {}
	onClick(_nodeId: string | null, _payload: ClickPayload): void {}
	onDragEnd(_nodeId: string | null, _payload: DragPayload): void {}
	onKeyDown(_payload: KeyPayload): void {}
}
