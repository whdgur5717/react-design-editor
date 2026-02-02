/**
 * Canvas에서 Shell로 전달되는 포인터 이벤트
 */
export interface CanvasPointerEvent {
	type: "mousedown" | "mousemove" | "mouseup" | "dragend"
	x: number
	y: number
	clientX: number
	clientY: number
	targetNodeId: string | null
	shiftKey: boolean
	ctrlKey: boolean
	metaKey: boolean
	altKey: boolean
	// dragend/mousemove 드래그 전용 필드
	nodeId?: string
	deltaX?: number
	deltaY?: number
	// resize 전용 필드
	isResizeStart?: boolean
	isResizeEnd?: boolean
	width?: number
	height?: number
}

/**
 * Canvas에서 Shell로 전달되는 키보드 이벤트
 */
export interface CanvasKeyEvent {
	type: "keydown" | "keyup"
	key: string
	code: string
	shiftKey: boolean
	ctrlKey: boolean
	metaKey: boolean
	altKey: boolean
}

/**
 * 드래그 종료 이벤트 (기존 Tool 시스템용)
 */
export interface DragEndEvent {
	type: "dragend"
	nodeId: string
	deltaX: number
	deltaY: number
}

/**
 * dnd-kit 드래그 종료 이벤트 (Canvas → Shell)
 */
export interface CanvasDndEndEvent {
	type: "dnd:end"
	activeNodeId: string
	overNodeId: string // 드롭 타겟 (최소 페이지 ID)
	delta: { x: number; y: number }
}
