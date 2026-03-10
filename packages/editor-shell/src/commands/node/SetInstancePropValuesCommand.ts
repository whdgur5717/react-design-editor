import type { Command, EditorReceiver, MergableCommand } from "../types"

/**
 * SetInstancePropValuesCommand - 인스턴스 prop 값 변경
 */
export class SetInstancePropValuesCommand implements MergableCommand {
	readonly mergeKey: string
	private readonly previousPropValues: Record<string, unknown>

	constructor(
		private readonly receiver: EditorReceiver,
		private readonly nodeId: string,
		private propValues: Record<string, unknown>,
		mergeKey: string,
	) {
		this.mergeKey = mergeKey
		const node = receiver.findNode(nodeId)
		this.previousPropValues = (node && "propValues" in node ? { ...node.propValues } : {}) as Record<string, unknown>
	}

	execute() {
		this.receiver.setInstancePropValues(this.nodeId, this.propValues)
	}

	undo() {
		this.receiver.setInstancePropValues(this.nodeId, this.previousPropValues)
	}

	merge(other: Command): boolean {
		if (!(other instanceof SetInstancePropValuesCommand) || other.nodeId !== this.nodeId) return false
		this.propValues = other.propValues
		return true
	}
}
