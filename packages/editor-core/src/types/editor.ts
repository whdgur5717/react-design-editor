import type { CSSProperties } from "react"

import type { DocumentNode, Position, SceneNode, Size } from "./node"
import type { NodeRect } from "./protocol"

/**
 * 에디터 도구 타입
 */
export type EditorTool = "select" | "frame" | "text" | "shape"

export interface NodeLocation {
	parentId: string
	index: number
}

export interface NodePageContext {
	pageId?: string
}

/**
 * 에디터 상태
 */
export interface EditorState {
	/** 현재 문서 */
	document: DocumentNode

	/** 현재 페이지 ID */
	currentPageId: string

	/** 선택된 노드 ID 목록 */
	selection: string[]

	/** 호버 중인 노드 ID */
	hoveredId: string | null

	/** 현재 선택된 도구 */
	activeTool: EditorTool

	/** 줌 레벨 (1 = 100%) */
	zoom: number

	/** 뷰포트 pan 오프셋 X (screen 좌표) */
	panX: number

	/** 뷰포트 pan 오프셋 Y (screen 좌표) */
	panY: number

	/** 드래그 프리뷰 (Shell 오버레이에서 렌더링) */
	dragPreview: { nodeId: string; dx: number; dy: number } | null

	/** 현재 PageNode 기준 노드 박스 캐시 */
	nodeRectsCache: Record<string, NodeRect>
}

/**
 * 에디터 액션
 */
export interface EditorActions {
	/** 노드 업데이트 */
	updateNode: (id: string, updates: Partial<SceneNode>, context?: NodePageContext) => void

	/** 노드 추가 */
	addNode: (parentId: string, node: SceneNode, index?: number, context?: NodePageContext) => void

	/** 노드 삭제 */
	removeNode: (id: string, context?: NodePageContext) => void

	/** 노드 이동 */
	moveNode: (id: string, position: Position, context?: NodePageContext) => void

	/** 노드 리사이즈 */
	resizeNode: (id: string, size: Size, context?: NodePageContext) => void

	/** 노드 순서 변경 (같은 부모 내에서) */
	reorderNode: (parentId: string, fromIndex: number, toIndex: number, context?: NodePageContext) => void

	/** 노드 드롭 처리 (위치 이동 또는 reparent) */
	dropNode: (sourceId: string, targetId: string, delta: { x: number; y: number }) => void

	/** 노드를 다른 부모로 이동 */
	reparentNode: (sourceId: string, newParentId: string, context?: NodePageContext) => void

	/** 선택 변경 */
	setSelection: (ids: string[]) => void

	/** 선택 토글 (Shift+클릭 다중 선택) */
	toggleSelection: (id: string) => void

	/** 호버 변경 */
	setHoveredId: (id: string | null) => void

	/** 도구 변경 */
	setActiveTool: (tool: EditorTool) => void

	/** 줌 변경 */
	setZoom: (zoom: number) => void

	/** 뷰포트 pan 변경 */
	setPan: (panX: number, panY: number) => void

	/** 가시성 토글 */
	toggleVisibility: (id: string, context?: NodePageContext) => void

	/** 잠금 상태 토글 */
	toggleLocked: (id: string, context?: NodePageContext) => void

	/** 노드 복제 */
	duplicateNode: (id: string) => string | null

	/** 페이지 변경 */
	setCurrentPage: (pageId: string) => void

	/** 페이지 추가 */
	addPage: (name: string) => string

	/** 페이지 삭제 */
	removePage: (pageId: string) => void

	/** 페이지 이름 변경 */
	renamePage: (pageId: string, name: string) => void

	/** 노드 찾기 */
	findNode: (id: string, context?: NodePageContext) => SceneNode | null

	/** 노드의 부모와 인덱스 찾기 */
	findNodeLocation: (id: string, context?: NodePageContext) => NodeLocation | null

	/** 드래그 프리뷰 설정 */
	setDragPreview: (preview: { nodeId: string; dx: number; dy: number } | null) => void

	/** 현재 PageNode 기준 노드 박스 캐시 설정 */
	setNodeRectsCache: (rects: Record<string, NodeRect>) => void

	/** 노드 스타일 개별 속성 업데이트 */
	updateNodeStyle: (id: string, styleUpdates: Partial<CSSProperties>) => void
}

/**
 * 에디터 스토어 (상태 + 액션)
 */
export type EditorStore = EditorState & EditorActions
