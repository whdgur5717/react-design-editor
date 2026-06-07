import type { DocumentNode } from "@design-editor/core"
import { describe, expect, it } from "vitest"

import { createEditorRuntime } from "./Editor"

function createTwoNodeDocument(): DocumentNode {
	return {
		id: "doc-root",
		children: [
			{
				id: "page-1",
				name: "Page 1",
				children: [
					{ id: "node-a", type: "element", tag: "div", children: [] },
					{ id: "node-b", type: "element", tag: "div", children: [] },
				],
			},
		],
	}
}

describe("문서 서비스", () => {
	it("노드를 숨긴 뒤 undo하면 다시 표시된다", () => {
		const editor = createEditorRuntime()

		editor.document.toggleVisibility("root")
		expect(editor.document.findNode("root")?.visible).toBe(false)
		expect(editor.history.getSnapshot().canUndo).toBe(true)

		editor.history.undo()
		expect(editor.document.findNode("root")?.visible).toBeUndefined()
	})

	it("레이어 순서를 바꾼 뒤 undo하면 원래 순서로 돌아간다", () => {
		const editor = createEditorRuntime({ document: createTwoNodeDocument(), currentPageId: "page-1" })

		editor.document.reorderNode("page-1", 0, 1)
		expect(editor.document.getCurrentPage()?.children.map((node) => node.id)).toEqual(["node-b", "node-a"])
		expect(editor.history.getSnapshot().canUndo).toBe(true)

		editor.history.undo()
		expect(editor.document.getCurrentPage()?.children.map((node) => node.id)).toEqual(["node-a", "node-b"])
	})
})
