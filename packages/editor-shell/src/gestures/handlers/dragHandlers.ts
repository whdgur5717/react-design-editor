import { commandHistory, MoveNodeCommand, receiver, ReparentNodeCommand } from "../../commands"
import { gestureRouter } from "../GestureRouter"

gestureRouter.register("drag", "began", () => {})

gestureRouter.register("drag", "ended", (gesture) => {
	const { nodeId, payload } = gesture
	if (!nodeId || !payload.delta) return

	const node = receiver.findNode(nodeId)
	if (!node) return

	const location = receiver.findNodeLocation(nodeId)
	if (!location) return

	if (payload.overNodeId && payload.overNodeId !== location.parentId) {
		const command = new ReparentNodeCommand(receiver, nodeId, payload.overNodeId)
		commandHistory.execute(command)
	} else {
		const currentLeft = typeof node.style?.left === "number" ? node.style.left : 0
		const currentTop = typeof node.style?.top === "number" ? node.style.top : 0

		const from = { x: currentLeft, y: currentTop }
		const to = { x: currentLeft + payload.delta.x, y: currentTop + payload.delta.y }

		const command = new MoveNodeCommand(receiver, nodeId, from, to)
		commandHistory.execute(command)
	}
})
