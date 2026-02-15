import type { NodeRect, PageNode } from "@design-editor/core"

import { getNodeScreenRectHybrid } from "../../utils/nodePosition"

interface DragPreviewProps {
	nodeId: string
	dx: number
	dy: number
	zoom: number
	page: PageNode
	nodeRectsCache: Record<string, NodeRect>
}

export function DragPreview({ nodeId, dx, dy, zoom, page, nodeRectsCache }: DragPreviewProps) {
	const rect = getNodeScreenRectHybrid(nodeId, zoom, page, nodeRectsCache)
	if (!rect) return null

	return (
		<div
			style={{
				position: "absolute",
				left: 0,
				top: 0,
				width: rect.width,
				height: rect.height,
				transform: `translate(${rect.x + dx * zoom}px, ${rect.y + dy * zoom}px)`,
				outline: "2px solid #0d99ff",
				outlineOffset: -1,
				backgroundColor: "rgba(13, 153, 255, 0.05)",
				pointerEvents: "none",
			}}
		/>
	)
}
