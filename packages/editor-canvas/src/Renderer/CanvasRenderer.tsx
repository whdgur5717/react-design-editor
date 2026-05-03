import type { PageNode, SceneNode } from "@design-editor/core"
import type React from "react"

import { type RenderContext, renderNode } from "./renderNode"
import { TextNodeRenderer } from "./TextNodeRenderer"

export interface CanvasRendererProps {
	page: PageNode
	onTextChange?: (nodeId: string, content: unknown) => void
}

function renderRootContent(child: SceneNode, ctx: RenderContext) {
	switch (child.type) {
		case "element":
			return child.children?.filter((c) => c.visible !== false).map((c) => renderNode(c, ctx)) ?? null
		case "text":
			return (
				<TextNodeRenderer key={child.id} node={child} onContentChange={(content) => ctx.onTextChange(child.id, content)} />
			)
	}
}

const noopTextChange = () => {}

export function CanvasRenderer({ page, onTextChange = noopTextChange }: CanvasRendererProps) {
	const ctx: RenderContext = { onTextChange }
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
									width: width,
									height: height,
									willChange: "transform",
									contain: "layout style",
									isolation: "isolate",
									"--editor-fixed-position": "absolute",
									"--editor-viewport-height": `${typeof height === "number" ? height : 0}px`,
								} as React.CSSProperties
							}
						>
							<div
								data-node-measure-id={child.id}
								style={{ ...contentStyle, width, height, position: "relative" }}
								data-layout-type="inner"
							>
								{renderRootContent(child, ctx)}
							</div>
						</div>
					)
				})}
		</>
	)
}
