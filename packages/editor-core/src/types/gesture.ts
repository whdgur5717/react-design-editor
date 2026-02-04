// Gesture Recognizer 패턴 기반 이벤트 시스템

export type GestureType = "click" | "drag" | "resize" | "key"
export type GestureState = "began" | "changed" | "ended" | "cancelled"

// 각 타입별 payload
export interface ClickPayload {
	x: number
	y: number
	shiftKey: boolean
	metaKey: boolean
}

export interface DragPayload {
	delta: { x: number; y: number }
	overNodeId?: string
}

export interface ResizePayload {
	width: number
	height: number
}

export interface KeyPayload {
	key: string
	code: string
	shiftKey: boolean
	ctrlKey: boolean
	metaKey: boolean
	altKey: boolean
}

// 타입별 payload 매핑
export interface GesturePayloadMap {
	click: ClickPayload
	drag: DragPayload
	resize: ResizePayload
	key: KeyPayload
}

// 통합 제스처 인터페이스
export interface CanvasGesture<T extends GestureType = GestureType> {
	type: T
	state: GestureState
	nodeId: string | null
	payload: GesturePayloadMap[T]
}
