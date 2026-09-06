import type { ClickPayload } from "@open-editor-sdk/core"

import { createFrameNode } from "./nodeFactory"
import { BaseTool } from "./types"

/**
 * Frame 도구 - 클릭으로 Frame 노드 생성
 */
export class FrameTool extends BaseTool {
	override name = "frame"
	override cursor = "crosshair"

	override onClick(_nodeId: string | null, payload: ClickPayload): void {
		const node = createFrameNode(payload.x, payload.y, 200, 150)
		const pageId = this.service.getCurrentPageId()
		this.service.executeAddNode(pageId, node)

		this.service.setSelection([node.id])
		this.service.setActiveTool("select")
	}
}
