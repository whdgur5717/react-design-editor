import { useEditorStore } from "../../services/EditorContext"
import { getNodeScreenRectHybrid, type Rect } from "../../utils/nodePosition"
import { DragPreview } from "./DragPreview"
import { HoverHighlight } from "./HoverHighlight"
import { ResizeHandles } from "./ResizeHandles"
import { SelectionOverlay } from "./SelectionOverlay"

export function ToolManagerOverlay() {
	const selection = useEditorStore((s) => s.selection)
	const hoveredId = useEditorStore((s) => s.hoveredId)
	const zoom = useEditorStore((s) => s.zoom)
	const panX = useEditorStore((s) => s.panX)
	const panY = useEditorStore((s) => s.panY)
	const dragPreview = useEditorStore((s) => s.dragPreview)
	const page = useEditorStore((s) => s.document.children.find((p) => p.id === s.currentPageId))
	const nodeRectsCache = useEditorStore((s) => s.nodeRectsCache)

	const selectionRects = new Map<string, Rect>()
	if (page) {
		for (const nodeId of selection) {
			const rect = getNodeScreenRectHybrid(nodeId, zoom, page, nodeRectsCache, panX, panY)
			if (rect) selectionRects.set(nodeId, rect)
		}
	}

	const hoverRect: Rect | null =
		hoveredId && !selection.includes(hoveredId) && page
			? getNodeScreenRectHybrid(hoveredId, zoom, page, nodeRectsCache, panX, panY)
			: null

	const singleSelectedRect = selection.length === 1 ? (selectionRects.get(selection[0]) ?? null) : null

	return (
		<>
			<SelectionOverlay rects={selectionRects} />
			{singleSelectedRect && !dragPreview && <ResizeHandles rect={singleSelectedRect} />}
			<HoverHighlight rect={hoverRect} />
			{dragPreview && page && (
				<DragPreview
					nodeId={dragPreview.nodeId}
					dx={dragPreview.dx}
					dy={dragPreview.dy}
					zoom={zoom}
					panX={panX}
					panY={panY}
					page={page}
					nodeRectsCache={nodeRectsCache}
				/>
			)}
		</>
	)
}
