import type { TextChangePayload } from "@design-editor/core"

import type { CommandHistory } from "../commands/CommandHistory"
import { UpdateNodeCommand } from "../commands/node/UpdateNodeCommand"
import type { EditorReceiver } from "../commands/types"

export class ApplyCanvasTextChangeUsecase {
	constructor(
		private readonly receiver: EditorReceiver,
		private readonly history: CommandHistory,
	) {}

	run(nodeId: string, content: unknown) {
		const node = this.receiver.findNode(nodeId)
		if (node?.type !== "text") return

		this.history.execute(
			new UpdateNodeCommand(this.receiver, nodeId, {
				content: content as TextChangePayload["content"],
			}),
		)
	}
}
