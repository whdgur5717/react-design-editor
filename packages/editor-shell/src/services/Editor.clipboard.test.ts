import { describe, expect, it } from "vitest"

import { Editor } from "./Editor"

describe("노드 클립보드", () => {
	it("복사 후 붙여넣기를 두 번 실행하면 새 ID를 유지한 채 offset이 누적된다", () => {
		const editor = new Editor()
		editor.setSelection(["root"])

		editor.actionRegistry.execute("clipboard:copy")
		editor.actionRegistry.execute("clipboard:paste")

		const firstPastedId = editor.getSelection()[0]
		expect(firstPastedId).not.toBe("root")

		const firstPastedNode = editor.findNode(firstPastedId)
		expect(firstPastedNode?.x).toBe(20)
		expect(firstPastedNode?.y).toBe(20)

		editor.actionRegistry.execute("clipboard:paste")

		const secondPastedId = editor.getSelection()[0]
		expect(secondPastedId).not.toBe("root")
		expect(secondPastedId).not.toBe(firstPastedId)

		const secondPastedNode = editor.findNode(secondPastedId)
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
		const editor = new Editor()
		editor.setSelection(["root"])

		editor.actionRegistry.execute("clipboard:copy")
		editor.actionRegistry.execute("clipboard:paste")

		const pastedId = editor.getSelection()[0]
		editor.commandHistory.undo()
		editor.commandHistory.redo()

		expect(editor.getSelection()).toEqual([pastedId])
		expect(editor.findNode(pastedId)?.x).toBe(20)
	})

	it("잘라내기를 되돌리면 페이지를 바꾼 뒤에도 원래 페이지와 위치로 복원된다", () => {
		const editor = new Editor()
		const firstPageId = editor.getCurrentPageId()
		const secondPageId = editor.store.getState().addPage("Page 2")

		editor.store.getState().setCurrentPage(firstPageId)
		editor.setSelection(["root"])
		editor.actionRegistry.execute("clipboard:cut")

		expect(editor.getCurrentPage()?.children).toHaveLength(0)

		editor.store.getState().setCurrentPage(secondPageId)
		editor.commandHistory.undo()

		const restoredPage = editor.receiver.findPage(firstPageId)
		expect(restoredPage?.children).toHaveLength(1)
		expect(restoredPage?.children[0]?.id).toBe("root")
	})

	it("다른 페이지에서 붙여넣으면 현재 페이지 루트에 추가된다", () => {
		const editor = new Editor()
		const firstPageId = editor.getCurrentPageId()
		const secondPageId = editor.store.getState().addPage("Page 2")

		editor.store.getState().setCurrentPage(firstPageId)
		editor.setSelection(["root"])
		editor.actionRegistry.execute("clipboard:copy")

		editor.store.getState().setCurrentPage(secondPageId)
		editor.actionRegistry.execute("clipboard:paste")

		const secondPage = editor.receiver.findPage(secondPageId)
		expect(secondPage?.children).toHaveLength(1)
		expect(secondPage?.children[0]?.id).not.toBe("root")
		expect(secondPage?.children[0]?.x).toBe(20)
	})
})
