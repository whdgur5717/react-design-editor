import type { DocumentNode } from "@open-editor-sdk/core"
import { expect, test, vi } from "vitest"

import { createEditor } from "./createEditor"

function createDocument(): DocumentNode {
	return {
		id: "doc-root",
		children: [
			{
				id: "page-a",
				name: "Page A",
				children: [
					{
						id: "root-a",
						type: "element",
						tag: "div",
						x: 12,
						y: 24,
						children: [],
					},
				],
			},
		],
	}
}

test("createEditor로 만든 에디터는 clipboard API를 제공한다", () => {
	const editor = createEditor()

	expect(editor.state.getSnapshot().currentPageId).toBe("page-1")
	expect(typeof editor.clipboard.copy).toBe("function")
	expect(typeof editor.clipboard.cut).toBe("function")
	expect(typeof editor.clipboard.paste).toBe("function")
})

test("createEditor에 초기 문서를 넘기면 해당 문서가 열린다", () => {
	const editor = createEditor({ document: createDocument(), currentPageId: "page-a" })
	const snapshot = editor.state.getSnapshot()

	expect(snapshot.currentPageId).toBe("page-a")
	expect(snapshot.document.children[0]?.children[0]?.id).toBe("root-a")
	expect(editor.document.findNode("root-a")?.x).toBe(12)
})

test("createEditor에 확장을 넘기면 등록한 액션을 실행할 수 있다", () => {
	const handler = vi.fn()
	const editor = createEditor({
		extensions: [
			{
				actions: () => [{ id: "custom:ping", handler }],
			},
		],
	})

	expect(editor.actions.execute("custom:ping")).toBe(true)
	expect(handler).toHaveBeenCalledTimes(1)
})
