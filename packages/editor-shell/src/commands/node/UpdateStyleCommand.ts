import type { CSSProperties } from "react"

import type { Command, EditorReceiver, MergableCommand } from "../types"

/**
 * UpdateStyleCommand - 스타일 개별 속성 변경 (변경된 키만 저장하여 효율적)
 */
export class UpdateStyleCommand implements MergableCommand {
	readonly mergeKey: string
	private readonly previousStyle: Partial<CSSProperties>

	constructor(
		private readonly receiver: EditorReceiver,
		private readonly nodeId: string,
		private styleUpdates: Partial<CSSProperties>,
		mergeKey: string,
	) {
		this.mergeKey = mergeKey
		const node = receiver.findNode(nodeId)
		this.previousStyle = {}
		if (node?.style) {
			for (const key of Object.keys(styleUpdates)) {
				;(this.previousStyle as Record<string, unknown>)[key] = (node.style as Record<string, unknown>)[key]
			}
		}
	}

	execute() {
		this.receiver.updateNodeStyle(this.nodeId, this.styleUpdates)
	}

	undo() {
		this.receiver.updateNodeStyle(this.nodeId, this.previousStyle)
	}

	merge(other: Command): boolean {
		if (!(other instanceof UpdateStyleCommand) || other.nodeId !== this.nodeId) return false
		Object.assign(this.styleUpdates, other.styleUpdates)
		return true
	}
}
