import { expect, test, vi } from "vitest"

import { createEditorRuntime } from "../services/Editor"
import type { EditorExtension } from "./types"

test("확장으로 등록한 액션과 도구를 실행할 수 있다", () => {
	const handler = vi.fn()
	const extension: EditorExtension = {
		tools: () => [
			{
				id: "shape",
				tool: {
					name: "shape",
					cursor: "crosshair",
					onActivate() {},
					onDeactivate() {},
					onClick() {},
					onDragEnd() {},
					onKeyDown() {},
				},
			},
		],
		actions: () => [{ id: "selection:all", handler }],
		keybindings: [{ key: "a", modifiers: {}, command: "selection:all" }],
	}
	const editor = createEditorRuntime({ extensions: [extension] })

	expect(editor.actions.execute("selection:all")).toBe(true)
	expect(handler).toHaveBeenCalledTimes(1)
	expect(editor.actions.execute("tool:shape")).toBe(true)
	expect(editor.state.getSnapshot().activeTool).toBe("shape")
})
