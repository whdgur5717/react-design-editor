import { toolRegistry } from "../../tools"
import { gestureRouter } from "../GestureRouter"

gestureRouter.register("click", "ended", (gesture) => {
	toolRegistry.handleClick(gesture.nodeId, gesture.payload)
})
