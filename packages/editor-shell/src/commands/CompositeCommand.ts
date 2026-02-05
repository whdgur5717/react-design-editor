import type { Command } from "./types"

/**
 * CompositeCommand - 여러 Command를 하나의 undo 단위로 묶음
 * 트랜잭션 지원, 실패 시 롤백
 */
export class CompositeCommand implements Command {
	private commands: Command[] = []
	private executed: Command[] = []

	/**
	 * Command 추가
	 */
	add(command: Command) {
		this.commands.push(command)
	}

	/**
	 * 모든 Command 실행
	 * 중간에 실패하면 이미 실행된 Command들을 롤백
	 */
	execute() {
		this.executed = []

		for (const command of this.commands) {
			try {
				command.execute()
				this.executed.push(command)
			} catch (error) {
				this.rollback()
				throw error
			}
		}
	}

	/**
	 * 모든 Command 실행 취소 (역순)
	 */
	undo() {
		for (let i = this.executed.length - 1; i >= 0; i--) {
			this.executed[i].undo()
		}
	}

	/**
	 * 실패 시 롤백 (역순으로 undo)
	 */
	private rollback() {
		for (let i = this.executed.length - 1; i >= 0; i--) {
			try {
				this.executed[i].undo()
			} catch {
				// TODO: 롤백 실패 시 사용자에게 알림 필요
				console.error("Error during rollback")
			}
		}
	}

	/**
	 * Command가 비어있는지 확인
	 */
	isEmpty() {
		return this.commands.length === 0
	}

	/**
	 * Command 개수
	 */
	get count() {
		return this.commands.length
	}
}
