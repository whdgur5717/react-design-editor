import { Extension } from "@tiptap/core"
import { Color } from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
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

export const extensions = [StarterKit, TextStyle, Color, EscapeBlur]
