import { CommandHistory } from "../commands/CommandHistory"
import type { Command } from "../commands/types"

export class HistoryService {
	constructor(private readonly history: CommandHistory) {}

	execute(command: Command) {
		this.history.execute(command)
	}

	undo() {
		this.history.undo()
	}

	redo() {
		this.history.redo()
	}

	clear() {
		this.history.clear()
	}

	beginTransaction() {
		this.history.beginTransaction()
	}

	commitTransaction() {
		this.history.commitTransaction()
	}

	rollbackTransaction() {
		this.history.rollbackTransaction()
	}

	isInTransaction() {
		return this.history.isInTransaction()
	}

	getSnapshot() {
		return this.history.getSnapshot()
	}

	subscribe(listener: () => void) {
		return this.history.subscribe(listener)
	}
}
