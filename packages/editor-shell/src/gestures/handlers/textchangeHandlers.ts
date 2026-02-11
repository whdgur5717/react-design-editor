import type { TextChangePayload } from "@design-editor/core"
import { isEqual } from "es-toolkit"

import { commandHistory, receiver, UpdateNodeCommand } from "../../commands"
import { gestureRouter } from "../GestureRouter"

// 텍스트 변경 완료 → UpdateNodeCommand 실행
gestureRouter.register("textchange", "ended", (gesture) => {
	const { nodeId, payload } = gesture
	if (!nodeId) return

	const { content } = payload as TextChangePayload

	// blur 시 content가 변경되지 않았으면 무시 (reparent remount 등)
	const currentNode = receiver.findNode(nodeId)
	if (currentNode?.type === "text" && isEqual(currentNode.content, content)) return

	const command = new UpdateNodeCommand(receiver, nodeId, { content })
	commandHistory.execute(command)
})
