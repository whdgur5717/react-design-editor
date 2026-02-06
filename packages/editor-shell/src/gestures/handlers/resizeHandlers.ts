import { commandHistory, receiver, ResizeNodeCommand } from "../../commands"
import { gestureRouter } from "../GestureRouter"

// 리사이즈 시작
gestureRouter.register("resize", "began", () => {
	// Command Pattern에서는 pause/resume 불필요
})

// 리사이즈 완료 → ResizeNodeCommand 실행
gestureRouter.register("resize", "ended", (gesture) => {
	const { nodeId, payload } = gesture
	if (!nodeId) return

	const node = receiver.findNode(nodeId)
	if (!node) return

	// 이전 크기
	const from = {
		width: node.style?.width,
		height: node.style?.height,
	}

	// 새 크기
	const to = {
		width: payload.width,
		height: payload.height,
	}

	const command = new ResizeNodeCommand(receiver, nodeId, from, to)
	commandHistory.execute(command)
})
