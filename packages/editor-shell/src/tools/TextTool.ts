import type { ClickPayload } from "@design-editor/core"

import { AddNodeCommand, commandHistory, receiver } from "../commands"
import { useEditorStore } from "../store/editor"
import { createTextNode } from "./nodeFactory"
import { BaseTool } from "./types"

/**
 * Text 도구 - 클릭으로 Text 노드 생성
 */
export class TextTool extends BaseTool {
	override name = "text"
	override cursor = "crosshair"

	override onClick(_nodeId: string | null, payload: ClickPayload): void {
		// 클릭 위치에 기본 크기로 노드 생성
		const node = createTextNode(payload.x, payload.y, 150)
		const pageId = receiver.getCurrentPageId()

		const command = new AddNodeCommand(receiver, pageId, node)
		commandHistory.execute(command)

		// 선택 변경 (undo 대상 아님)
		useEditorStore.getState().setSelection([node.id])

		// SelectTool로 전환 (undo 대상 아님)
		useEditorStore.getState().setActiveTool("select")
	}
}
