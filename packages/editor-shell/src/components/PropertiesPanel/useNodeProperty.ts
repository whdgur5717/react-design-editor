import type { Position } from "@design-editor/core"
import type { CSSProperties } from "react"
import { useCallback } from "react"

import { useEditor } from "../../services/EditorContext"

export function useNodeProperty(nodeId: string) {
	const editor = useEditor()

	const updateStyle = useCallback(
		(key: keyof CSSProperties, value: CSSProperties[keyof CSSProperties]) => {
			editor.updateNodeStyleProperty(nodeId, key, value)
		},
		[editor, nodeId],
	)

	const updatePosition = useCallback(
		(position: Position) => editor.updateNodePosition(nodeId, position),
		[editor, nodeId],
	)

	const updatePropValues = useCallback(
		(propValues: Record<string, unknown>) => {
			editor.updateInstancePropValues(nodeId, propValues)
		},
		[editor, nodeId],
	)

	return { updateStyle, updatePosition, updatePropValues }
}
