import type { PageSnapshot } from "@design-editor/core"

import { type ComponentResolver, renderNode } from "./renderNode"

export interface CanvasRendererProps {
	page: PageSnapshot
	onTextChange?: (nodeId: string, content: unknown) => void
	resolveComponent?: ComponentResolver
}

const noopTextChange = () => {}

export function CanvasRenderer({ page, onTextChange = noopTextChange, resolveComponent }: CanvasRendererProps) {
	const ctx = { onTextChange, resolveComponent }
	return (
		<>
			{page.children
				.filter((child) => child.visible !== false)
				.map((child) => (
					<div
						key={child.id}
						data-node-id={child.id}
						data-node-measure-id={child.id}
						style={{
							position: "absolute",
							transform: `translateX(${child.x ?? 0}px) translateY(${child.y ?? 0}px)`,
							willChange: "transform",
							contain: "layout style",
							isolation: "isolate",
						}}
					>
						{renderNode(child, ctx)}
					</div>
				))}
		</>
	)
}
