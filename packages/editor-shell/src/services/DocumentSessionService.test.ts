import type { DocumentNode } from "@open-editor-sdk/core"
import { describe, expect, it } from "vitest"

import { createEditorRuntime } from "./Editor"

function createDocument(): DocumentNode {
	return {
		id: "loaded-doc",
		children: [
			{
				id: "loaded-page",
				name: "Loaded Page",
				children: [
					{
						id: "loaded-root",
						type: "element",
						tag: "section",
						children: [],
					},
				],
			},
		],
	}
}

describe("문서 세션 서비스", () => {
	it("문서를 불러오면 임시 에디터 상태와 undo history를 초기화한다", () => {
		const editor = createEditorRuntime()

		editor.selection.setSelection(["root"])
		editor.selection.setHoveredId("root")
		editor.viewport.setZoom(2)
		editor.viewport.setPan(120, 80)
		editor.geometry.setNodeRectsCache({ root: { x: 1, y: 2, width: 3, height: 4 } })
		editor.history.execute({
			execute() {},
			undo() {},
		})

		expect(editor.history.getSnapshot().canUndo).toBe(true)

		editor.documentSession.loadDocument(createDocument(), "loaded-page")
		const snapshot = editor.state.getSnapshot()

		expect(snapshot.currentPageId).toBe("loaded-page")
		expect(snapshot.document.id).toBe("loaded-doc")
		expect(snapshot.selection).toEqual([])
		expect(snapshot.hoveredId).toBeNull()
		expect(snapshot.dragPreview).toBeNull()
		expect(snapshot.zoom).toBe(1)
		expect(snapshot.panX).toBe(0)
		expect(snapshot.panY).toBe(0)
		expect(snapshot.nodeRectsCache).toEqual({})
		expect(editor.history.getSnapshot()).toEqual({ canUndo: false, canRedo: false })
	})
})
