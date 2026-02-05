import { toolRegistry } from "../../tools"
import { gestureRouter } from "../GestureRouter"

gestureRouter.register("drag", "began", () => {})

gestureRouter.register("drag", "ended", (gesture) => {
	toolRegistry.handleDragEnd(gesture.nodeId, gesture.payload)
})
