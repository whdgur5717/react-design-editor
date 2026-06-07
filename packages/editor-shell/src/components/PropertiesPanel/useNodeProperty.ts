import type { Position } from "@design-editor/core"
import type { CSSProperties } from "react"
import { useCallback } from "react"

import { useEditor } from "../../services/EditorContext"

export function useNodeProperty(nodeId: string) {
	const editor = useEditor()

	const updateStyle = useCallback(
		(key: keyof CSSProperties, value: CSSProperties[keyof CSSProperties]) => {
			editor.document.updateStyleProperty(nodeId, key, value)
		},
		[editor, nodeId],
	)

	const updatePosition = useCallback(
		(position: Position) => editor.document.updatePosition(nodeId, position),
		[editor, nodeId],
	)

	return { updateStyle, updatePosition }
}
