import type { TextNode } from "@design-editor/core"
import type { JSONContent } from "@tiptap/core"
import { Extension } from "@tiptap/core"
import { Color } from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

const EscapeBlur = Extension.create({
	name: "escapeBlur",
	addKeyboardShortcuts() {
		return {
			Escape: ({ editor }) => {
				editor.commands.blur()
				return true
			},
		}
	},
})

const extensions = [StarterKit, TextStyle, Color, EscapeBlur]

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
