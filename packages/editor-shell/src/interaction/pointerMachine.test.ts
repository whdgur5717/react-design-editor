import { describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import type { Editor } from "../services/Editor"
import { createPointerMachine } from "./pointerMachine"

describe("createPointerMachine", () => {
	it("uses the measured rect as the resize starting size", () => {
		const resizeHandle = document.createElement("div")
		resizeHandle.dataset.resizeHandle = "e"
		Object.defineProperty(resizeHandle, "setPointerCapture", {
			value: vi.fn(),
			configurable: true,
		})

		const resizeNode = vi.fn()
		const editor = {
			toolRegistry: {
				handleDragEnd: vi.fn(),
				handleClick: vi.fn(),
				getActiveTool: vi.fn(() => null),
			},
			actionRegistry: {
				execute: vi.fn(),
			},
			keybindingRegistry: {
				match: vi.fn(() => null),
			},
			getSelection: vi.fn(() => ["node-1"]),
			findNode: vi.fn(() => ({
				id: "node-1",
				type: "element",
				tag: "div",
				style: {
					width: 100,
					height: 50,
				},
			})),
			getNodeRenderedRect: vi.fn(() => ({
				x: 10,
				y: 20,
				width: 180,
				height: 70,
			})),
			getZoom: vi.fn(() => 1),
			resizeNode,
			setHoveredId: vi.fn(),
			hitTestNodeId: vi.fn(() => null),
			setDragPreview: vi.fn(),
			getPan: vi.fn(() => ({ x: 0, y: 0 })),
			setPan: vi.fn(),
			setZoom: vi.fn(),
			setSelection: vi.fn(),
		} as unknown as Editor
		const actor = createActor(createPointerMachine(editor))

		actor.start()
		actor.send({
			type: "POINTER_DOWN",
			clientX: 0,
			clientY: 0,
			pointerId: 1,
			shiftKey: false,
			metaKey: false,
			target: resizeHandle,
		})
		actor.send({
			type: "POINTER_MOVE",
			clientX: 20,
			clientY: 0,
		})

		expect(resizeNode).toHaveBeenCalledWith(
			"node-1",
			{ width: 180, height: 70 },
			{ width: 200, height: 70 },
			expect.stringMatching(/^resize:node-1:/),
		)

		actor.stop()
	})
})
