import type { NodeRect } from "@open-editor-sdk/core"

import { getCachedNodePageRect } from "../../utils/nodePosition"

interface DragPreviewProps {
	nodeId: string
	dx: number
	dy: number
	zoom: number
	nodeRectsCache: Record<string, NodeRect>
}

export function DragPreview({ nodeId, dx, dy, zoom, nodeRectsCache }: DragPreviewProps) {
	const rect = getCachedNodePageRect(nodeId, nodeRectsCache)
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
