import { toolRegistry } from "../../tools"
import { gestureRouter } from "../GestureRouter"

// 클릭 완료 → Tool에 위임
gestureRouter.register("click", "ended", (gesture) => {
	const tool = toolRegistry.getActiveTool()
	tool?.onClick(gesture.nodeId, gesture.payload)
})
