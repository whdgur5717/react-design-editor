import type { ComponentDefinition, PageNode } from "@design-editor/core"
import type React from "react"

import { renderNodeChildren } from "./renderNode"

interface CanvasRendererProps {
	page: PageNode
	components: ComponentDefinition[]
	onTextChange: (nodeId: string, content: unknown) => void
}

export function CanvasRenderer({ page, components, onTextChange }: CanvasRendererProps) {
	const ctx = { components, onTextChange }
	return (
		<>
			{page.children
				.filter((child) => child.visible !== false)
				.map((child) => {
					const x = child.x ?? 0
					const y = child.y ?? 0
					const { width, height, ...contentStyle } = child.style ?? {}

					return (
						<div
							key={child.id}
							data-node-id={child.id}
							style={
								{
									position: "fixed",
									transform: `translateX(${x}px) translateY(${y}px)`,
									width,
									height,
									willChange: "transform",
									contain: "layout style",
									isolation: "isolate",
									"--editor-fixed-position": "absolute",
									"--editor-viewport-height": `${typeof height === "number" ? height : 0}px`,
								} as React.CSSProperties
							}
						>
							<div style={{ ...contentStyle, width: "100%", height: "100%", position: "relative" }}>
								{renderNodeChildren(child, ctx)}
							</div>
						</div>
					)
				})}
		</>
	)
}
