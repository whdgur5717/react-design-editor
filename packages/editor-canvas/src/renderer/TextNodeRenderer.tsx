import type { TextNode } from "@design-editor/core"
import type { JSONContent } from "@tiptap/core"
import { EditorContent, useEditor } from "@tiptap/react"

import { extensions } from "../tiptap/extensions"

interface TextNodeRendererProps {
	node: TextNode
	onContentChange: (content: JSONContent) => void
}

export function TextNodeRenderer({ node, onContentChange }: TextNodeRendererProps) {
	const editor = useEditor({
		content: node.content,
		extensions,
		onBlur: ({ editor }) => {
			onContentChange(editor.getJSON())
		},
	})

	return <EditorContent editor={editor} />
}
