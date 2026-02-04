import { commandRegistry } from "../../commands"
import { keybindingRegistry } from "../../keybindings"
import { toolRegistry } from "../../tools"
import { gestureRouter } from "../GestureRouter"

// keydown → keybinding 매칭 또는 Tool에 위임
gestureRouter.register("key", "began", (gesture) => {
	const { payload } = gesture

	// 1. Keybinding 매칭 시도
	const commandId = keybindingRegistry.match(payload)
	if (commandId) {
		commandRegistry.execute(commandId)
		return
	}

	// 2. Tool에 위임
	const tool = toolRegistry.getActiveTool()
	tool?.onKeyDown(payload)
})

// keyup은 현재 사용하지 않음
// gestureRouter.register("key", "ended", () => {})
