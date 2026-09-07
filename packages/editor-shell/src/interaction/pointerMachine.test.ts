import type { SceneNode } from "@open-editor-sdk/core"
import { describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { createPointerMachine, type PointerMachineDeps } from "./pointerMachine"

function createPointerTarget() {
	const target = document.createElement("div")
	const setPointerCapture = vi.fn()
	Object.defineProperty(target, "setPointerCapture", {
		value: setPointerCapture,
		configurable: true,
	})
	return { target, setPointerCapture }
}

function createDeps(
	overrides: {
		handleClick?: PointerMachineDeps["tools"]["handleClick"]
		handleDragEnd?: PointerMachineDeps["tools"]["handleDragEnd"]
		hitTestNodeId?: PointerMachineDeps["geometry"]["hitTestNodeId"]
		findNode?: PointerMachineDeps["document"]["findNode"]
		resizeNode?: PointerMachineDeps["document"]["resizeNode"]
		getSelection?: PointerMachineDeps["selection"]["getSelection"]
		setSelection?: PointerMachineDeps["selection"]["setSelection"]
		setDragPreview?: PointerMachineDeps["dragPreview"]["setDragPreview"]
		getZoom?: PointerMachineDeps["viewport"]["getZoom"]
		getPan?: PointerMachineDeps["viewport"]["getPan"]
		getNodeRenderedRect?: PointerMachineDeps["geometry"]["getNodeRenderedRect"]
	} = {},
): PointerMachineDeps {
	return {
		tools: {
			handleClick: overrides.handleClick ?? vi.fn(),
			handleDragEnd: overrides.handleDragEnd ?? vi.fn(),
			getActiveTool: vi.fn(() => undefined),
		},
		actions: {
			execute: vi.fn(),
		},
		keybindings: {
			match: vi.fn(() => null),
		},
		document: {
			findNode: overrides.findNode ?? vi.fn(() => null),
			resizeNode: overrides.resizeNode ?? vi.fn(),
		},
		selection: {
			getSelection: overrides.getSelection ?? vi.fn(() => []),
			setHoveredId: vi.fn(),
			setSelection: overrides.setSelection ?? vi.fn(),
		},
		viewport: {
			getZoom: overrides.getZoom ?? vi.fn(() => 1),
			getPan: overrides.getPan ?? vi.fn(() => ({ x: 0, y: 0 })),
			setPan: vi.fn(),
			setZoom: vi.fn(),
		},
		geometry: {
			getNodeRenderedRect: overrides.getNodeRenderedRect ?? vi.fn(() => null),
			hitTestNodeId: overrides.hitTestNodeId ?? vi.fn(() => null),
		},
		dragPreview: {
			setDragPreview: overrides.setDragPreview ?? vi.fn(),
		},
	}
}

describe("포인터 상태 머신", () => {
	it("노드를 클릭하면 현재 도구의 클릭 동작이 실행된다", () => {
		const { target, setPointerCapture } = createPointerTarget()
		const handleClick = vi.fn()
		const hitTestNodeId = vi.fn(() => "node-1")
		const deps = createDeps({
			handleClick,
			hitTestNodeId,
			getZoom: vi.fn(() => 2),
			getPan: vi.fn(() => ({ x: 10, y: 20 })),
		})
		const actor = createActor(createPointerMachine(deps))

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

	it("노드를 드래그하면 선택 상태와 drag preview를 갱신한 뒤 drag end를 실행한다", () => {
		const { target } = createPointerTarget()
		const handleDragEnd = vi.fn()
		const setDragPreview = vi.fn()
		const setSelection = vi.fn()
		const hitTestNodeId = vi.fn().mockReturnValueOnce("node-1").mockReturnValue("parent-1")
		const findNode = vi.fn(
			() =>
				({
					id: "node-1",
					type: "element",
					tag: "div",
					x: 8,
					y: 9,
				}) satisfies SceneNode,
		)
		const deps = createDeps({
			handleDragEnd,
			setDragPreview,
			setSelection,
			hitTestNodeId,
			findNode,
			getZoom: vi.fn(() => 2),
		})
		const actor = createActor(createPointerMachine(deps))

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

	it("리사이즈는 스타일값이 아니라 실제 측정 크기를 기준으로 시작한다", () => {
		const { target: resizeHandle } = createPointerTarget()
		resizeHandle.dataset.resizeHandle = "e"

		const resizeNode = vi.fn()
		const deps = createDeps({
			resizeNode,
			getSelection: vi.fn(() => ["node-1"]),
			findNode: vi.fn(
				() =>
					({
						id: "node-1",
						type: "element",
						tag: "div",
						style: {
							width: 100,
							height: 50,
						},
					}) satisfies SceneNode,
			),
			getNodeRenderedRect: vi.fn(() => ({
				x: 10,
				y: 20,
				width: 180,
				height: 70,
			})),
		})
		const actor = createActor(createPointerMachine(deps))

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
