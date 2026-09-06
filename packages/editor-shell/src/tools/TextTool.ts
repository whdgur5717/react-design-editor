import type { ClickPayload } from "@open-editor-sdk/core"

import { createTextNode } from "./nodeFactory"
import { BaseTool } from "./types"

/**
 * Text 도구 - 클릭으로 Text 노드 생성
 */
export class TextTool extends BaseTool {
	override name = "text"
	override cursor = "crosshair"

	override onClick(_nodeId: string | null, payload: ClickPayload): void {
		const node = createTextNode(payload.x, payload.y, 150)
		const pageId = this.service.getCurrentPageId()
		this.service.executeAddNode(pageId, node)

		this.service.setSelection([node.id])
		this.service.setActiveTool("select")
	}
}
