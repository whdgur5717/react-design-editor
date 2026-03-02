import { describe, expect, it } from "vitest"

import { CommandHistory } from "../CommandHistory"
import type { Command, MergableCommand } from "../types"

/** 단순 값 추적용 Command */
class SimpleCommand implements Command {
	constructor(
		private readonly state: { value: number },
		private readonly from: number,
		private readonly to: number,
	) {}

	execute() {
		this.state.value = this.to
	}

	undo() {
		this.state.value = this.from
	}
}

/** 병합 가능한 Command */
class MergableTestCommand implements MergableCommand {
	readonly mergeKey: string

	constructor(
		private readonly state: { value: number },
		private readonly from: number,
		private to: number,
		mergeKey: string,
	) {
		this.mergeKey = mergeKey
	}

	execute() {
		this.state.value = this.to
	}

	undo() {
		this.state.value = this.from
	}

	merge(other: Command): boolean {
		if (!(other instanceof MergableTestCommand)) return false
		this.to = other.to
		return true
	}
}

describe("커맨드 병합", () => {
	it("같은 mergeKey를 가진 커맨드는 하나의 undo 단위로 병합된다", () => {
		const history = new CommandHistory()
		const state = { value: 0 }

		history.execute(new MergableTestCommand(state, 0, 10, "session-1"))
		history.execute(new MergableTestCommand(state, 10, 20, "session-1"))
		history.execute(new MergableTestCommand(state, 20, 30, "session-1"))

		expect(state.value).toBe(30)
		expect(history.undoCount).toBe(1)
	})

	it("다른 mergeKey를 가진 커맨드는 병합되지 않는다", () => {
		const history = new CommandHistory()
		const state = { value: 0 }

		history.execute(new MergableTestCommand(state, 0, 10, "session-1"))
		history.execute(new MergableTestCommand(state, 10, 20, "session-2"))

		expect(state.value).toBe(20)
		expect(history.undoCount).toBe(2)
	})

	it("병합된 커맨드를 undo하면 최초 상태로 복원된다", () => {
		const history = new CommandHistory()
		const state = { value: 0 }

		history.execute(new MergableTestCommand(state, 0, 10, "session-1"))
		history.execute(new MergableTestCommand(state, 10, 20, "session-1"))
		history.execute(new MergableTestCommand(state, 20, 30, "session-1"))

		history.undo()

		expect(state.value).toBe(0)
	})

	it("병합된 커맨드를 redo하면 최종 상태가 적용된다", () => {
		const history = new CommandHistory()
		const state = { value: 0 }

		history.execute(new MergableTestCommand(state, 0, 10, "session-1"))
		history.execute(new MergableTestCommand(state, 10, 20, "session-1"))
		history.execute(new MergableTestCommand(state, 20, 30, "session-1"))

		history.undo()
		history.redo()

		expect(state.value).toBe(30)
	})

	it("mergeKey가 없는 일반 Command는 병합되지 않는다", () => {
		const history = new CommandHistory()
		const state = { value: 0 }

		history.execute(new SimpleCommand(state, 0, 10))
		history.execute(new SimpleCommand(state, 10, 20))

		expect(history.undoCount).toBe(2)
	})

	it("트랜잭션 중에는 병합이 적용되지 않는다", () => {
		const history = new CommandHistory()
		const state = { value: 0 }

		history.execute(new MergableTestCommand(state, 0, 10, "session-1"))

		history.beginTransaction()
		history.execute(new MergableTestCommand(state, 10, 20, "session-1"))
		history.commitTransaction()

		expect(history.undoCount).toBe(2)
	})
})
