import type { CanvasGesture, ComponentDefinition, GestureType, PageNode } from "@design-editor/core"

import { NodeWrapper } from "./NodeWrapper"
import { renderNode } from "./renderNode"
import { applyPositionOverride } from "./utils"

interface CanvasRendererProps {
	page: PageNode
	components: ComponentDefinition[]
	selectedIds: string[]
	positionOverrides: Map<string, { x: number; y: number }>
	onResizeStart: () => void
	onResizeEnd: (nodeId: string, width: number, height: number) => void
	sendGesture: <T extends GestureType>(gesture: CanvasGesture<T>) => void
}

export function CanvasRenderer({
	page,
	components,
	selectedIds,
	positionOverrides,
	onResizeStart,
	onResizeEnd,
	sendGesture,
}: CanvasRendererProps) {
	const ctx = { components, selectedIds, positionOverrides, onResizeStart, onResizeEnd, sendGesture }
	return (
		<>
			{page.children
				.filter((child) => child.visible !== false)
				.map((child) => {
					const effectiveNode = applyPositionOverride(child, positionOverrides)
					return (
						<NodeWrapper
							key={child.id}
							node={effectiveNode}
							isSelected={selectedIds.includes(child.id)}
							onResizeStart={onResizeStart}
							onResizeEnd={(width, height) => onResizeEnd(child.id, width, height)}
						>
							{renderNode(child, ctx)}
						</NodeWrapper>
					)
				})}
		</>
	)
}
