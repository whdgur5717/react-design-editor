import { describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import type { Editor } from "../services/Editor"
import { createPointerMachine } from "./pointerMachine"

describe("createPointerMachine", () => {
	it("hit tests pointer down and handles a single click from pending", () => {
		const target = document.createElement("div")
		const setPointerCapture = vi.fn()
		Object.defineProperty(target, "setPointerCapture", {
			value: setPointerCapture,
			configurable: true,
		})

		const handleClick = vi.fn()
		const hitTestNodeId = vi.fn(() => "node-1")
		const editor = {
			toolRegistry: {
				handleDragEnd: vi.fn(),
				handleClick,
				getActiveTool: vi.fn(() => null),
			},
			actionRegistry: {
				execute: vi.fn(),
			},
			keybindingRegistry: {
				match: vi.fn(() => null),
			},
			getSelection: vi.fn(() => []),
			findNode: vi.fn(() => null),
			getNodeRenderedRect: vi.fn(() => null),
			getZoom: vi.fn(() => 2),
			resizeNode: vi.fn(),
			setHoveredId: vi.fn(),
			hitTestNodeId,
			setDragPreview: vi.fn(),
			getPan: vi.fn(() => ({ x: 10, y: 20 })),
			setPan: vi.fn(),
			setZoom: vi.fn(),
			setSelection: vi.fn(),
		} as unknown as Editor
		const actor = createActor(createPointerMachine(editor))

		actor.start()
		actor.send({
			type: "POINTER_DOWN",
			clientX: 50,
			clientY: 70,
			pointerId: 7,
			shiftKey: true,
			metaKey: false,
			target,
		})

		expect(actor.getSnapshot().matches({ active: "pending" })).toBe(true)
		expect(hitTestNodeId).toHaveBeenCalledWith(50, 70)
		expect(setPointerCapture).toHaveBeenCalledWith(7)

		actor.send({
			type: "POINTER_UP",
			clientX: 50,
			clientY: 70,
			shiftKey: true,
			metaKey: false,
		})

		expect(handleClick).toHaveBeenCalledWith("node-1", {
			x: 20,
			y: 25,
			shiftKey: true,
			metaKey: false,
		})

		actor.stop()
	})

	it("keeps drag behavior after entering pending directly", () => {
		const target = document.createElement("div")
		Object.defineProperty(target, "setPointerCapture", {
			value: vi.fn(),
			configurable: true,
		})

		const handleDragEnd = vi.fn()
		const setDragPreview = vi.fn()
		const setSelection = vi.fn()
		const editor = {
			toolRegistry: {
				handleDragEnd,
				handleClick: vi.fn(),
				getActiveTool: vi.fn(() => null),
			},
			actionRegistry: {
				execute: vi.fn(),
			},
			keybindingRegistry: {
				match: vi.fn(() => null),
			},
			getSelection: vi.fn(() => []),
			findNode: vi.fn(() => ({
				id: "node-1",
				type: "element",
				tag: "div",
				x: 8,
				y: 9,
			})),
			getNodeRenderedRect: vi.fn(() => null),
			getZoom: vi.fn(() => 2),
			resizeNode: vi.fn(),
			setHoveredId: vi.fn(),
			hitTestNodeId: vi.fn().mockReturnValueOnce("node-1").mockReturnValue("parent-1"),
			setDragPreview,
			getPan: vi.fn(() => ({ x: 0, y: 0 })),
			setPan: vi.fn(),
			setZoom: vi.fn(),
			setSelection,
		} as unknown as Editor
		const actor = createActor(createPointerMachine(editor))

		actor.start()
		actor.send({
			type: "POINTER_DOWN",
			clientX: 100,
			clientY: 100,
			pointerId: 1,
			shiftKey: false,
			metaKey: false,
			target,
		})
		actor.send({
			type: "POINTER_MOVE",
			clientX: 110,
			clientY: 100,
		})
		actor.send({
			type: "POINTER_MOVE",
			clientX: 130,
			clientY: 118,
		})
		actor.send({
			type: "POINTER_UP",
			clientX: 150,
			clientY: 130,
			shiftKey: false,
			metaKey: false,
		})

		expect(setSelection).toHaveBeenCalledWith(["node-1"])
		expect(setDragPreview).toHaveBeenCalledWith({ nodeId: "node-1", dx: 15, dy: 9 })
		expect(setDragPreview).toHaveBeenLastCalledWith(null)
		expect(handleDragEnd).toHaveBeenCalledWith("node-1", {
			delta: { x: 25, y: 15 },
			initialPosition: { x: 8, y: 9 },
			overNodeId: "parent-1",
		})

		actor.stop()
	})

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
