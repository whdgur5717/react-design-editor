import { CompositeCommand } from "./CompositeCommand"
import type { Command } from "./types"

/**
 * CommandHistory - Invoker
 * Command 실행 및 undo/redo 스택 관리
 */
export class CommandHistory {
	private undoStack: Command[] = []
	private redoStack: Command[] = []
	private transaction: CompositeCommand | null = null
	private readonly limit: number
	private listeners: Set<() => void> = new Set()
	private snapshot: { canUndo: boolean; canRedo: boolean } = { canUndo: false, canRedo: false }

	constructor(limit: number = 50) {
		this.limit = limit
	}

	/**
	 * 상태 변경 구독 (React useSyncExternalStore용)
	 */
	subscribe(listener: () => void) {
		this.listeners.add(listener)
		return () => this.listeners.delete(listener)
	}

	/**
	 * 현재 상태 스냅샷 (React useSyncExternalStore용)
	 */
	getSnapshot() {
		return this.snapshot
	}

	private notify() {
		this.snapshot = {
			canUndo: this.undoStack.length > 0,
			canRedo: this.redoStack.length > 0,
		}
		for (const listener of this.listeners) {
			listener()
		}
	}

	/**
	 * Command 실행
	 * 트랜잭션 중이면 트랜잭션에 추가, 아니면 즉시 실행
	 */
	execute(command: Command) {
		if (this.transaction) {
			this.transaction.add(command)
		} else {
			command.execute()
			this.undoStack.push(command)
			this.redoStack = []

			// 히스토리 제한
			if (this.undoStack.length > this.limit) {
				this.undoStack.shift()
			}
			this.notify()
		}
	}

	/**
	 * 마지막 Command 실행 취소
	 */
	undo() {
		const command = this.undoStack.pop()
		if (command) {
			command.undo()
			this.redoStack.push(command)
			this.notify()
		}
	}

	/**
	 * 마지막으로 취소된 Command 다시 실행
	 */
	redo() {
		const command = this.redoStack.pop()
		if (command) {
			command.execute()
			this.undoStack.push(command)
			this.notify()
		}
	}

	/**
	 * 트랜잭션 시작
	 * 이후 execute() 호출은 트랜잭션에 추가됨
	 */
	beginTransaction() {
		if (this.transaction) {
			throw new Error("Transaction already in progress")
		}
		this.transaction = new CompositeCommand()
	}

	/**
	 * 트랜잭션 커밋
	 * 트랜잭션 내 모든 Command를 하나의 undo 단위로 실행
	 */
	commitTransaction() {
		if (!this.transaction) {
			throw new Error("No transaction in progress")
		}

		const composite = this.transaction
		this.transaction = null

		// 트랜잭션이 비어있지 않으면 실행
		if (!composite.isEmpty()) {
			composite.execute()
			this.undoStack.push(composite)
			this.redoStack = []

			if (this.undoStack.length > this.limit) {
				this.undoStack.shift()
			}
			this.notify()
		}
	}

	/**
	 * 트랜잭션 롤백
	 * 트랜잭션 내 Command들을 실행하지 않고 버림
	 */
	rollbackTransaction() {
		this.transaction = null
	}

	/**
	 * 트랜잭션 진행 중 여부
	 */
	isInTransaction() {
		return this.transaction !== null
	}

	/**
	 * Undo 가능 여부
	 */
	canUndo() {
		return this.undoStack.length > 0
	}

	/**
	 * Redo 가능 여부
	 */
	canRedo() {
		return this.redoStack.length > 0
	}

	/**
	 * 히스토리 초기화
	 */
	clear() {
		this.undoStack = []
		this.redoStack = []
		this.transaction = null
		this.notify()
	}

	/**
	 * Undo 스택 크기
	 */
	get undoCount() {
		return this.undoStack.length
	}

	/**
	 * Redo 스택 크기
	 */
	get redoCount() {
		return this.redoStack.length
	}
}
