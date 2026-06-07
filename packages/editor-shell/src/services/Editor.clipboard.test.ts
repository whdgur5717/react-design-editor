import { describe, expect, it } from "vitest"

import { createInitialEditorModel } from "../store/editor"
import { createEditorRuntime } from "./Editor"

function createTwoPageEditor() {
	const model = createInitialEditorModel()
	const secondPageId = "page-2"
	model.document.children.push({ id: secondPageId, name: "Page 2", children: [] })
	return {
		editor: createEditorRuntime({ document: model.document, currentPageId: model.currentPageId }),
		firstPageId: model.currentPageId,
		secondPageId,
	}
}

describe("노드 클립보드", () => {
	it("복사 후 붙여넣기를 두 번 실행하면 새 ID를 유지한 채 offset이 누적된다", () => {
		const editor = createEditorRuntime()
		editor.selection.setSelection(["root"])

		editor.actions.execute("clipboard:copy")
		editor.actions.execute("clipboard:paste")

		const firstPastedId = editor.selection.getSelection()[0]
		expect(firstPastedId).not.toBe("root")

		const firstPastedNode = editor.document.findNode(firstPastedId)
		expect(firstPastedNode?.x).toBe(20)
		expect(firstPastedNode?.y).toBe(20)

		editor.actions.execute("clipboard:paste")

		const secondPastedId = editor.selection.getSelection()[0]
		expect(secondPastedId).not.toBe("root")
		expect(secondPastedId).not.toBe(firstPastedId)

		const secondPastedNode = editor.document.findNode(secondPastedId)
		expect(secondPastedNode?.x).toBe(40)
		expect(secondPastedNode?.y).toBe(40)

		const firstTextId = firstPastedNode?.children?.[0]?.id
		const secondTextId = secondPastedNode?.children?.[0]?.id
		expect(firstTextId).toBeDefined()
		expect(secondTextId).toBeDefined()
		expect(firstTextId).not.toBe("text-1")
		expect(secondTextId).not.toBe("text-1")
		expect(secondTextId).not.toBe(firstTextId)
	})

	it("붙여넣기 실행을 되돌린 뒤 다시 실행하면 같은 ID로 복원된다", () => {
		const editor = createEditorRuntime()
		editor.selection.setSelection(["root"])

		editor.actions.execute("clipboard:copy")
		editor.actions.execute("clipboard:paste")

		const pastedId = editor.selection.getSelection()[0]
		editor.history.undo()
		editor.history.redo()

		expect(editor.selection.getSelection()).toEqual([pastedId])
		expect(editor.document.findNode(pastedId)?.x).toBe(20)
	})

	it("잘라내기를 되돌리면 페이지를 바꾼 뒤에도 원래 페이지와 위치로 복원된다", () => {
		const { editor, firstPageId, secondPageId } = createTwoPageEditor()

		editor.documentSession.setCurrentPage(firstPageId)
		editor.selection.setSelection(["root"])
		editor.actions.execute("clipboard:cut")

		expect(editor.document.getCurrentPage()?.children).toHaveLength(0)

		editor.documentSession.setCurrentPage(secondPageId)
		editor.history.undo()

		const restoredPage = editor.document.findPage(firstPageId)
		expect(restoredPage?.children).toHaveLength(1)
		expect(restoredPage?.children[0]?.id).toBe("root")
	})

	it("다른 페이지에서 붙여넣으면 현재 페이지 루트에 추가된다", () => {
		const { editor, firstPageId, secondPageId } = createTwoPageEditor()

		editor.documentSession.setCurrentPage(firstPageId)
		editor.selection.setSelection(["root"])
		editor.actions.execute("clipboard:copy")

		editor.documentSession.setCurrentPage(secondPageId)
		editor.actions.execute("clipboard:paste")

		const secondPage = editor.document.findPage(secondPageId)
		expect(secondPage?.children).toHaveLength(1)
		expect(secondPage?.children[0]?.id).not.toBe("root")
		expect(secondPage?.children[0]?.x).toBe(20)
	})
})
