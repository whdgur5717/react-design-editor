import type { PageNode } from "@design-editor/core"
import type { ComponentType } from "react"
import type React from "react"

import { type RenderContext, renderNodeChildren } from "./renderNode"

interface CanvasRendererProps {
	page: PageNode
	codeComponents: Record<string, ComponentType<Record<string, unknown>>>
	onTextChange: (nodeId: string, content: unknown) => void
}

export function CanvasRenderer({ page, codeComponents, onTextChange }: CanvasRendererProps) {
	const ctx: RenderContext = { codeComponents, onTextChange }
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
							data-layout-type="outer"
							style={
								{
									position: "fixed",
									transform: `translateX(${x}px) translateY(${y}px)`,
									width: width ?? "fit-content",
									height: height ?? "fit-content",
									willChange: "transform",
									contain: "layout style",
									isolation: "isolate",
									"--editor-fixed-position": "absolute",
									"--editor-viewport-height": `${typeof height === "number" ? height : 0}px`,
								} as React.CSSProperties
							}
						>
							<div style={{ ...contentStyle, width, height, position: "relative" }} data-layout-type="inner">
								{renderNodeChildren(child, ctx)}
							</div>
						</div>
					)
				})}
		</>
	)
}
