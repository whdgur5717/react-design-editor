import type { Position } from "@design-editor/core"
import type { CSSProperties } from "react"

import type { CommandHistory } from "../commands/CommandHistory"
import { MoveNodeCommand } from "../commands/node/MoveNodeCommand"
import { UpdateStyleCommand } from "../commands/node/UpdateStyleCommand"
import type { EditorReceiver } from "../commands/types"

export class NodePropertyUsecase {
	constructor(
		private readonly receiver: EditorReceiver,
		private readonly history: CommandHistory,
	) {}

	updateStyle(nodeId: string, key: keyof CSSProperties, value: CSSProperties[keyof CSSProperties]) {
		const cmd = new UpdateStyleCommand(this.receiver, nodeId, { [key]: value }, `style-${nodeId}-${key}`)
		this.history.execute(cmd)
	}

	updatePosition(nodeId: string, position: Position) {
		const node = this.receiver.findNode(nodeId)
		if (!node) return
		const cmd = new MoveNodeCommand(this.receiver, nodeId, { x: node.x ?? 0, y: node.y ?? 0 }, position)
		this.history.execute(cmd)
	}
}
