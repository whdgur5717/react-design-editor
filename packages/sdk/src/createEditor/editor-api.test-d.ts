import type { DocumentNode } from "@design-editor/core"
import { expectTypeOf } from "vitest"

import { createEditor } from "./createEditor"

const document: DocumentNode = {
	id: "doc-root",
	children: [{ id: "page-a", name: "Page A", children: [] }],
}

const editor = createEditor()
const snapshot = editor.state.getSnapshot()
const page = snapshot.document.children[0]
const node = page?.children[0]
const publicNode = editor.document.findNode("root")

createEditor({ document, currentPageId: "page-a" })
createEditor({ document })

expectTypeOf(snapshot.selection).toEqualTypeOf<readonly string[]>()

// @ts-expect-error snapshot은 readonly여야 한다.
snapshot.currentPageId = "other-page"

// @ts-expect-error snapshot 배열은 readonly여야 한다.
snapshot.selection.push("root")

if (page) {
	// @ts-expect-error page snapshot은 readonly여야 한다.
	page.name = "Renamed"
}

if (node) {
	// @ts-expect-error node snapshot은 readonly여야 한다.
	node.id = "other-node"
}

if (publicNode) {
	// @ts-expect-error 공개 document read 결과는 readonly여야 한다.
	publicNode.x = 999
}

expectTypeOf(editor).not.toHaveProperty("store")
expectTypeOf(editor).not.toHaveProperty("commandHistory")
expectTypeOf(editor).not.toHaveProperty("toolRegistry")
