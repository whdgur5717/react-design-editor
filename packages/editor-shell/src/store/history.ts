import type { ComponentDefinition, DocumentNode } from "@design-editor/core"
import { create } from "zustand"

import { useEditorStore } from "./editor"

/**
 * 최대 히스토리 스택 크기
 */
const MAX_HISTORY_SIZE = 50

/**
 * 히스토리 스냅샷 (저장 대상 상태)
 */
export interface HistoryEntry {
	document: DocumentNode
	components: ComponentDefinition[]
	selection: string[]
}

/**
 * 히스토리 상태
 */
interface HistoryState {
	past: HistoryEntry[]
	future: HistoryEntry[]
	isInTransaction: boolean
	transactionStart: HistoryEntry | null
}

/**
 * 히스토리 액션
 */
interface HistoryActions {
	/** 이전 상태로 복원 */
	undo: () => void
	/** 다음 상태로 복원 */
	redo: () => void
	/** Undo 가능 여부 */
	canUndo: () => boolean
	/** Redo 가능 여부 */
	canRedo: () => boolean
	/** 연속 작업 시작 (드래그/리사이즈) */
	startTransaction: () => void
	/** 연속 작업 완료 - 히스토리에 1개만 저장 */
	endTransaction: () => void
	/** 연속 작업 취소 - 시작 시점으로 복원 */
	cancelTransaction: () => void
	/** 현재 상태를 히스토리에 저장 */
	takeSnapshot: () => void
	/** 히스토리 초기화 */
	clear: () => void
}

type HistoryStore = HistoryState & HistoryActions

/**
 * 현재 EditorStore 상태를 캡처
 */
function captureCurrentState(): HistoryEntry {
	const state = useEditorStore.getState()
	return {
		document: structuredClone(state.document),
		components: structuredClone(state.components),
		selection: [...state.selection],
	}
}

/**
 * 히스토리 스토어
 */
export const useHistoryStore = create<HistoryStore>()((set, get) => ({
	// 초기 상태
	past: [],
	future: [],
	isInTransaction: false,
	transactionStart: null,

	canUndo: () => get().past.length > 0,
	canRedo: () => get().future.length > 0,

	takeSnapshot: () => {
		const { isInTransaction } = get()

		// 트랜잭션 중에는 스냅샷을 저장하지 않음
		if (isInTransaction) return

		const entry = captureCurrentState()

		set((state) => ({
			past: [...state.past, entry].slice(-MAX_HISTORY_SIZE),
			future: [], // 새 작업 시 redo 스택 초기화
		}))
	},

	startTransaction: () => {
		const { isInTransaction } = get()
		if (isInTransaction) return

		const entry = captureCurrentState()
		set({ isInTransaction: true, transactionStart: entry })
	},

	endTransaction: () => {
		const { isInTransaction, transactionStart } = get()
		if (!isInTransaction || !transactionStart) return

		// 트랜잭션 시작 시점 상태를 past에 저장
		set((state) => ({
			past: [...state.past, transactionStart].slice(-MAX_HISTORY_SIZE),
			future: [],
			isInTransaction: false,
			transactionStart: null,
		}))
	},

	cancelTransaction: () => {
		const { isInTransaction, transactionStart } = get()
		if (!isInTransaction || !transactionStart) return

		// 시작 시점 상태로 복원
		useEditorStore.setState({
			document: transactionStart.document,
			components: transactionStart.components,
			selection: transactionStart.selection,
		})

		set({ isInTransaction: false, transactionStart: null })
	},

	undo: () => {
		const { past, future } = get()
		if (past.length === 0) return

		// 현재 상태를 future에 저장
		const currentEntry = captureCurrentState()
		const previous = past[past.length - 1]

		// EditorStore 상태 복원
		useEditorStore.setState({
			document: previous.document,
			components: previous.components,
			selection: previous.selection,
		})

		set({
			past: past.slice(0, -1),
			future: [currentEntry, ...future],
		})
	},

	redo: () => {
		const { past, future } = get()
		if (future.length === 0) return

		// 현재 상태를 past에 저장
		const currentEntry = captureCurrentState()
		const next = future[0]

		// EditorStore 상태 복원
		useEditorStore.setState({
			document: next.document,
			components: next.components,
			selection: next.selection,
		})

		set({
			past: [...past, currentEntry],
			future: future.slice(1),
		})
	},

	clear: () => set({ past: [], future: [], isInTransaction: false, transactionStart: null }),
}))
