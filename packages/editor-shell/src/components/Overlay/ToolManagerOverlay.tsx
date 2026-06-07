import { useEditorState } from "../../services/EditorContext"
import { getCachedNodePageRect, type Rect } from "../../utils/nodePosition"
import { DragPreview } from "./DragPreview"
import { HoverHighlight } from "./HoverHighlight"
import { ResizeHandles } from "./ResizeHandles"
import { SelectionOverlay } from "./SelectionOverlay"

export function ToolManagerOverlay() {
	const { selection, hoveredId, zoom, panX, panY, dragPreview, nodeRectsCache, page } = useEditorState((snapshot) => ({
		selection: snapshot.selection,
		hoveredId: snapshot.hoveredId,
		zoom: snapshot.zoom,
		panX: snapshot.panX,
		panY: snapshot.panY,
		dragPreview: snapshot.dragPreview,
		nodeRectsCache: snapshot.nodeRectsCache,
		page: snapshot.document.children.find((candidate) => candidate.id === snapshot.currentPageId) ?? null,
	}))

	if (!page) return null

	const selectionRects = new Map<string, Rect>()
	for (const nodeId of selection) {
		const rect = getCachedNodePageRect(nodeId, nodeRectsCache)
		if (rect) selectionRects.set(nodeId, rect)
	}

	const hoverRect = hoveredId && !selection.includes(hoveredId) ? getCachedNodePageRect(hoveredId, nodeRectsCache) : null

	const singleSelectedRect = selection.length === 1 ? (selectionRects.get(selection[0]) ?? null) : null

	return (
		<div
			style={{
				position: "absolute",
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
					nodeRectsCache={nodeRectsCache}
				/>
			)}
		</div>
	)
}
