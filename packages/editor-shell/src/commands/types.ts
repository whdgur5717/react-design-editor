import type { ElementNode, PageNode, Position, SceneNode, Size } from "@design-editor/core"

/**
 * Command 인터페이스 - Command Pattern의 핵심
 */
export interface Command {
	execute(): void
	undo(): void
}

/**
 * 인스턴스 오버라이드 타입
 * Store의 setInstanceOverride와 동일한 타입
 */
export interface InstanceOverrides {
	props?: Record<string, unknown>
	style?: Record<string, unknown>
	children?: string
}

/**
 * 노드 위치 정보 (부모 내에서의 위치)
 */
export interface NodeLocation {
	parentId: string
	index: number
}

/**
 * EditorReceiver - Command가 주입받는 인터페이스
 * Store 메서드와 1:1 대응 (개별 메서드)
 */
export interface EditorReceiver {
	// ========== 노드 액션 (undo 대상) ==========

	/** 노드 업데이트 */
	updateNode(id: string, updates: Partial<SceneNode>): void

	/** 노드 추가 */
	addNode(parentId: string, node: SceneNode, index?: number): void

	/** 노드 삭제 */
	removeNode(id: string): void

	/** 노드 위치 이동 */
	moveNode(id: string, position: Position): void

	/** 노드 크기 변경 */
	resizeNode(id: string, size: Size): void

	/** 노드 순서 변경 (같은 부모 내에서) */
	reorderNode(parentId: string, fromIndex: number, toIndex: number): void

	/** 노드를 다른 부모로 이동 */
	reparentNode(sourceId: string, newParentId: string): void

	/** 가시성 토글 */
	toggleVisibility(id: string): void

	/** 잠금 상태 토글 */
	toggleLocked(id: string): void

	/** 노드 복제 */
	duplicateNode(id: string): string | null

	// ========== 컴포넌트 액션 (undo 대상) ==========

	/** 컴포넌트 생성 */
	createComponent(nodeId: string, name: string): string | null

	/** 컴포넌트 인스턴스 생성 */
	createInstance(componentId: string, parentId: string): string | null

	/** 컴포넌트 정의 업데이트 */
	updateComponent(componentId: string, updates: Partial<ElementNode>): void

	/** 컴포넌트 삭제 */
	deleteComponent(componentId: string): void

	/** 인스턴스 오버라이드 설정 */
	setInstanceOverride(instanceId: string, targetNodeId: string, overrides: InstanceOverrides): void

	/** 인스턴스 오버라이드 리셋 */
	resetInstanceOverrides(instanceId: string): void

	// ========== 페이지 액션 (undo 대상) ==========

	/** 페이지 추가 */
	addPage(name: string): string

	/** 페이지 삭제 */
	removePage(pageId: string): void

	/** 페이지 이름 변경 */
	renamePage(pageId: string, name: string): void

	// ========== 조회 메서드 (Command에서 이전 상태 저장용) ==========

	/** 노드 찾기 */
	findNode(id: string): SceneNode | null

	/** 현재 페이지 ID */
	getCurrentPageId(): string

	/** 현재 페이지 */
	getCurrentPage(): PageNode | null

	/** 노드의 부모와 인덱스 찾기 */
	findNodeLocation(id: string): NodeLocation | null

	/** 페이지 찾기 */
	findPage(pageId: string): PageNode | null

	/** 선택된 노드 ID 목록 */
	getSelection(): string[]

	/** 선택 변경 */
	setSelection(ids: string[]): void
}
