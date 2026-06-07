import type { NodeSnapshot } from "@design-editor/core"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { useEditor, useEditorState } from "../../services/EditorContext"
import { LayerChildren } from "./LayerChildren"

interface SortableLayerItemProps {
	node: NodeSnapshot
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
	const editor = useEditor()
	const { selection, hoveredId } = useEditorState((snapshot) => ({
		selection: snapshot.selection,
		hoveredId: snapshot.hoveredId,
	}))

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
		editor.selection.setSelection([node.id])
	}

	const handleVisibilityClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		editor.document.toggleVisibility(node.id)
	}

	const handleLockClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		editor.document.toggleLocked(node.id)
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
				data-testid={`layer-row-${node.id}`}
				style={{ paddingLeft: depth * 16 + 8 }}
				onClick={handleRowClick}
				onMouseEnter={() => editor.selection.setHoveredId(node.id)}
				onMouseLeave={() => editor.selection.setHoveredId(null)}
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
