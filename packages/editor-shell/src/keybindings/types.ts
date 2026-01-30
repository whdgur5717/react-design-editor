/**
 * Keybinding 정의
 */
export interface Keybinding {
	/** 키 (예: 'z', 'Delete', 'Escape') */
	key: string

	/** 수정자 키 */
	modifiers: {
		meta?: boolean // Cmd (Mac) / Ctrl (Windows)
		ctrl?: boolean
		shift?: boolean
		alt?: boolean
	}

	/** 실행할 Command ID */
	command: string

	/** 조건 (예: 'hasSelection') */
	when?: string
}

/**
 * 키보드 이벤트 인터페이스 (Canvas/Shell 공통)
 */
export interface KeyEventLike {
	key: string
	code: string
	shiftKey: boolean
	ctrlKey: boolean
	metaKey: boolean
	altKey: boolean
}
