import type { ClickPayload } from "@design-editor/core"

import { useEditorStore } from "../store/editor"
import { createFrameNode } from "./nodeFactory"
import { BaseTool } from "./types"

/**
 * Frame 도구 - 클릭으로 Frame 노드 생성
 * TODO: 드래그로 크기 지정하는 기능은 별도 Gesture로 리팩토링 필요
 */
export class FrameTool extends BaseTool {
	override name = "frame"
	override cursor = "crosshair"

	override onClick(_nodeId: string | null, payload: ClickPayload): void {
		// 클릭 위치에 기본 크기로 노드 생성
		const node = createFrameNode(payload.x, payload.y, 200, 150)
		const pageId = useEditorStore.getState().currentPageId
		useEditorStore.getState().addNode(pageId, node)
		useEditorStore.getState().setSelection([node.id])

		// SelectTool로 전환
		useEditorStore.getState().setActiveTool("select")
	}
}
