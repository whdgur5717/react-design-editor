import { useShallow } from "zustand/react/shallow"

import { useEditorStore } from "../../services/EditorContext"
import { getNodePageRectHybrid, type Rect } from "../../utils/nodePosition"
import { DragPreview } from "./DragPreview"
import { HoverHighlight } from "./HoverHighlight"
import { ResizeHandles } from "./ResizeHandles"
import { SelectionOverlay } from "./SelectionOverlay"

export function ToolManagerOverlay() {
	const { selection, hoveredId, zoom, panX, panY, dragPreview, nodeRectsCache } = useEditorStore(
		useShallow((s) => ({
			selection: s.selection,
			hoveredId: s.hoveredId,
			zoom: s.zoom,
			panX: s.panX,
			panY: s.panY,
			dragPreview: s.dragPreview,
			nodeRectsCache: s.nodeRectsCache,
		})),
	)
	const page = useEditorStore((s) => s.document.children.find((p) => p.id === s.currentPageId))

	if (!page) return null

	const selectionRects = new Map<string, Rect>()
	for (const nodeId of selection) {
		const rect = getNodePageRectHybrid(nodeId, zoom, page, nodeRectsCache, panX, panY)
		if (rect) selectionRects.set(nodeId, rect)
	}

	const hoverRect =
		hoveredId && !selection.includes(hoveredId)
			? getNodePageRectHybrid(hoveredId, zoom, page, nodeRectsCache, panX, panY)
			: null

	const singleSelectedRect = selection.length === 1 ? (selectionRects.get(selection[0]) ?? null) : null

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: 0,
				height: 0,
				transformOrigin: "0 0",
				willChange: "transform",
				transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
				pointerEvents: "none",
			}}
		>
			<SelectionOverlay rects={selectionRects} zoom={zoom} />
			{singleSelectedRect && !dragPreview && <ResizeHandles rect={singleSelectedRect} zoom={zoom} />}
			<HoverHighlight rect={hoverRect} zoom={zoom} />
			{dragPreview && (
				<DragPreview
					nodeId={dragPreview.nodeId}
					dx={dragPreview.dx}
					dy={dragPreview.dy}
					zoom={zoom}
					page={page}
					nodeRectsCache={nodeRectsCache}
					panX={panX}
					panY={panY}
				/>
			)}
		</div>
	)
}
