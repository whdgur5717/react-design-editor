import type { ClickPayload } from "@design-editor/core"

import { useEditorStore } from "../store/editor"
import { createTextNode } from "./nodeFactory"
import { BaseTool } from "./types"

/**
 * Text 도구 - 클릭으로 Text 노드 생성
 * TODO: 드래그로 크기 지정하는 기능은 별도 Gesture로 리팩토링 필요
 */
export class TextTool extends BaseTool {
	override name = "text"
	override cursor = "crosshair"

	override onClick(_nodeId: string | null, payload: ClickPayload): void {
		// 클릭 위치에 기본 크기로 노드 생성
		const node = createTextNode(payload.x, payload.y, 150)
		const pageId = useEditorStore.getState().currentPageId
		useEditorStore.getState().addNode(pageId, node)
		useEditorStore.getState().setSelection([node.id])

		// SelectTool로 전환
		useEditorStore.getState().setActiveTool("select")
	}
}
