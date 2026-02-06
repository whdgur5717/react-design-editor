import type { TextChangePayload } from "@design-editor/core"

import { commandHistory, receiver, UpdateNodeCommand } from "../../commands"
import { gestureRouter } from "../GestureRouter"

// 텍스트 변경 완료 → UpdateNodeCommand 실행
gestureRouter.register("textchange", "ended", (gesture) => {
	const { nodeId, payload } = gesture
	if (!nodeId) return

	const { content } = payload as TextChangePayload

	const command = new UpdateNodeCommand(receiver, nodeId, { content })
	commandHistory.execute(command)
})
