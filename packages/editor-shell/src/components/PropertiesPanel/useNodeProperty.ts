import type { Position } from "@design-editor/core"
import type { CSSProperties } from "react"
import { useCallback } from "react"

import { MoveNodeCommand, SetInstancePropValuesCommand, UpdateStyleCommand } from "../../commands"
import { useEditor } from "../../services/EditorContext"

export function useNodeProperty(nodeId: string) {
	const editor = useEditor()

	const updateStyle = useCallback(
		(key: keyof CSSProperties, value: CSSProperties[keyof CSSProperties]) => {
			const cmd = new UpdateStyleCommand(editor.getReceiver(), nodeId, { [key]: value }, `style-${nodeId}-${key}`)
			editor.executeCommand(cmd)
		},
		[editor, nodeId],
	)

	const updatePosition = useCallback(
		(position: Position) => {
			const node = editor.getReceiver().findNode(nodeId)
			if (!node) return
			const cmd = new MoveNodeCommand(editor.getReceiver(), nodeId, { x: node.x ?? 0, y: node.y ?? 0 }, position)
			editor.executeCommand(cmd)
		},
		[editor, nodeId],
	)

	const updatePropValues = useCallback(
		(propValues: Record<string, unknown>) => {
			const cmd = new SetInstancePropValuesCommand(editor.getReceiver(), nodeId, propValues, `prop-${nodeId}`)
			editor.executeCommand(cmd)
		},
		[editor, nodeId],
	)

	return { updateStyle, updatePosition, updatePropValues }
}
