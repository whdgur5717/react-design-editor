import type { NodeRect, PageNode } from "@design-editor/core"

import { getNodePageRectHybrid } from "../../utils/nodePosition"

interface DragPreviewProps {
	nodeId: string
	dx: number
	dy: number
	zoom: number
	page: PageNode
	nodeRectsCache: Record<string, NodeRect>
	panX: number
	panY: number
}

export function DragPreview({ nodeId, dx, dy, zoom, page, nodeRectsCache, panX, panY }: DragPreviewProps) {
	const rect = getNodePageRectHybrid(nodeId, zoom, page, nodeRectsCache, panX, panY)
	if (!rect) return null

	return (
		<div
			style={{
				position: "absolute",
				left: 0,
				top: 0,
				width: rect.width,
				height: rect.height,
				transform: `translate(${rect.x + dx}px, ${rect.y + dy}px)`,
				outline: `${2 / zoom}px solid #0d99ff`,
				outlineOffset: `${-1 / zoom}px`,
				backgroundColor: "rgba(13, 153, 255, 0.05)",
				pointerEvents: "none",
			}}
		/>
	)
}
