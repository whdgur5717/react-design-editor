import type { SceneNode } from "@design-editor/core"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { useEditorStore } from "../../services/EditorContext"
import { LayerChildren } from "./LayerChildren"

interface SortableLayerItemProps {
	node: SceneNode
	depth: number
	parentId: string | null
	index: number
	collapsedIds: Set<string>
	onToggleCollapse: (id: string) => void
}

export function SortableLayerItem({
	node,
	depth,
	parentId: _parentId,
	index: _index,
	collapsedIds,
	onToggleCollapse,
}: SortableLayerItemProps) {
	const selection = useEditorStore((state) => state.selection)
	const hoveredId = useEditorStore((state) => state.hoveredId)
	const setSelection = useEditorStore((state) => state.setSelection)
	const setHoveredId = useEditorStore((state) => state.setHoveredId)
	const toggleVisibility = useEditorStore((state) => state.toggleVisibility)
	const toggleLocked = useEditorStore((state) => state.toggleLocked)

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	}

	const isSelected = selection.includes(node.id)
	const isHovered = hoveredId === node.id
	const isVisible = node.visible !== false
	const isLocked = node.locked === true
	const hasChildren = "children" in node && Array.isArray(node.children) && node.children.length > 0
	const isCollapsed = collapsedIds.has(node.id)

	const handleRowClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		setSelection([node.id])
	}

	const handleVisibilityClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		toggleVisibility(node.id)
	}

	const handleLockClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		toggleLocked(node.id)
	}

	const handleCollapseClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		onToggleCollapse(node.id)
	}

	return (
		<div ref={setNodeRef} style={style} className="layer-item">
			<div
				className={`layer-row ${isSelected ? "selected" : ""} ${isHovered ? "hovered" : ""} ${!isVisible ? "hidden-layer" : ""}`}
				data-node-id={node.id}
				style={{ paddingLeft: depth * 16 + 8 }}
				onClick={handleRowClick}
				onMouseEnter={() => setHoveredId(node.id)}
				onMouseLeave={() => setHoveredId(null)}
			>
				<button className="layer-collapse-btn" onClick={handleCollapseClick} disabled={!hasChildren}>
					{hasChildren ? (isCollapsed ? "▶" : "▼") : "─"}
				</button>
				<span className="layer-name" {...attributes} {...listeners}>
					{node.type === "element" ? node.tag : node.type === "text" ? "Text" : "Instance"}
				</span>
				<div className="layer-actions">
					<button
						className={`layer-action-btn ${isLocked ? "active" : ""}`}
						onClick={handleLockClick}
						title={isLocked ? "Unlock" : "Lock"}
					>
						{isLocked ? "🔒" : "🔓"}
					</button>
					<button
						className={`layer-action-btn ${!isVisible ? "active" : ""}`}
						onClick={handleVisibilityClick}
						title={isVisible ? "Hide" : "Show"}
					>
						{isVisible ? "👁" : "👁‍🗨"}
					</button>
				</div>
			</div>
			{hasChildren && !isCollapsed && "children" in node && Array.isArray(node.children) && (
				<LayerChildren
					nodes={node.children}
					depth={depth + 1}
					parentId={node.id}
					collapsedIds={collapsedIds}
					onToggleCollapse={onToggleCollapse}
				/>
			)}
		</div>
	)
}
