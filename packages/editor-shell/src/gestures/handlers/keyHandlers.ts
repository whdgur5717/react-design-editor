import { shortcutRegistry } from "../../commands"
import { keybindingRegistry } from "../../keybindings"
import { toolRegistry } from "../../tools"
import { gestureRouter } from "../GestureRouter"

gestureRouter.register("key", "began", (gesture) => {
	const { payload } = gesture

	const shortcutId = keybindingRegistry.match(payload)
	if (shortcutId) {
		shortcutRegistry.execute(shortcutId)
		return
	}

	const tool = toolRegistry.getActiveTool()
	tool?.onKeyDown(payload)
})

// keyup은 현재 사용하지 않음
// gestureRouter.register("key", "ended", () => {})
