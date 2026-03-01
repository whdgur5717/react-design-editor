import type { SceneNode } from "@design-editor/core"
import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { useEditorStore } from "../../services/EditorContext"
import { SortableLayerItem } from "./SortableLayerItem"

interface LayerChildrenProps {
	nodes: SceneNode[]
	depth: number
	parentId: string
	collapsedIds: Set<string>
	onToggleCollapse: (id: string) => void
}

export function LayerChildren({ nodes, depth, parentId, collapsedIds, onToggleCollapse }: LayerChildrenProps) {
	const reorderNode = useEditorStore((state) => state.reorderNode)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event
		if (!over || active.id === over.id) return

		const oldIndex = nodes.findIndex((c) => c.id === active.id)
		const newIndex = nodes.findIndex((c) => c.id === over.id)

		if (oldIndex !== -1 && newIndex !== -1) {
			reorderNode(parentId, oldIndex, newIndex)
		}
	}

	return (
		<div className="layer-children">
			<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
				<SortableContext items={nodes.map((c) => c.id)} strategy={verticalListSortingStrategy}>
					{nodes.map((child, index) => (
						<SortableLayerItem
							key={child.id}
							node={child}
							depth={depth}
							parentId={parentId}
							index={index}
							collapsedIds={collapsedIds}
							onToggleCollapse={onToggleCollapse}
						/>
					))}
				</SortableContext>
			</DndContext>
		</div>
	)
}
