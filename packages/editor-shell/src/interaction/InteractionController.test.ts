import { expect, test, vi } from "vitest"

import { InteractionController } from "./InteractionController"
import type { PointerMachineDeps } from "./pointerMachine"

function createDeps(hitTestNodeId = vi.fn(() => null)): PointerMachineDeps {
	return {
		document: {
			findNode: vi.fn(() => null),
			resizeNode: vi.fn(),
		},
		selection: {
			getSelection: vi.fn(() => []),
			setSelection: vi.fn(),
			setHoveredId: vi.fn(),
		},
		viewport: {
			getZoom: vi.fn(() => 1),
			getPan: vi.fn(() => ({ x: 0, y: 0 })),
			setZoom: vi.fn(),
			setPan: vi.fn(),
		},
		geometry: {
			hitTestNodeId,
			getNodeRenderedRect: vi.fn(() => null),
		},
		dragPreview: {
			setDragPreview: vi.fn(),
		},
		tools: {
			handleClick: vi.fn(),
			handleDragEnd: vi.fn(),
			getActiveTool: vi.fn(() => undefined),
		},
		actions: {
			execute: vi.fn(),
		},
		keybindings: {
			match: vi.fn(() => null),
		},
	}
}

test("입력 처리기는 종료한 뒤 다시 시작할 수 있다", () => {
	const hitTestNodeId = vi.fn(() => null)
	const controller = new InteractionController(createDeps(hitTestNodeId))

	controller.start()
	controller.dispose()
	controller.start()
	controller.sendPointerMove({ clientX: 10, clientY: 20 })

	expect(hitTestNodeId).toHaveBeenCalledWith(10, 20)
	controller.dispose()
})
