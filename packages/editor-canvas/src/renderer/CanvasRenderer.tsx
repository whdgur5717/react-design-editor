import type { PageNode } from "@design-editor/core"

import { renderNode } from "./renderNode"

interface CanvasRendererProps {
	page: PageNode
	selectedIds: string[]
	positionOverrides: Map<string, { x: number; y: number }>
	onResizeStart: () => void
	onResizeEnd: (nodeId: string, width: number, height: number) => void
}

export function CanvasRenderer({
	page,
	selectedIds,
	positionOverrides,
	onResizeStart,
	onResizeEnd,
}: CanvasRendererProps) {
	const ctx = { selectedIds, positionOverrides, onResizeStart, onResizeEnd }

	return <>{page.children.filter((child) => child.visible !== false).map((child) => renderNode(child, ctx))}</>
}
