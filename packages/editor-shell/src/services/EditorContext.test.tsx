import { expect, test } from "vitest"
import { page } from "vitest/browser"
import { render } from "vitest-browser-react"

import { createEditorRuntime } from "./Editor"
import { EditorContextProvider, useEditor, useEditorState } from "./EditorContext"

function SelectionProbe() {
	const editor = useEditor()
	const selection = useEditorState((snapshot) => snapshot.selection.join(","))

	return (
		<button type="button" onClick={() => editor.selection.setSelection(["root"])} data-testid="selection-probe">
			{selection || "empty"}
		</button>
	)
}

test("선택 상태가 바뀌면 구독 중인 컴포넌트가 다시 렌더링된다", async () => {
	const editor = createEditorRuntime()
	render(
		<EditorContextProvider editor={editor}>
			<SelectionProbe />
		</EditorContextProvider>,
	)

	await expect.element(page.getByTestId("selection-probe")).toHaveTextContent("empty")
	await page.getByTestId("selection-probe").click()
	await expect.element(page.getByTestId("selection-probe")).toHaveTextContent("root")
})
