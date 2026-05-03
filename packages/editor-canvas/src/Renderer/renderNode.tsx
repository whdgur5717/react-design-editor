import type { SceneNode } from "@design-editor/core"
import type React from "react"

import { renderElementNode } from "./ElementNodeRenderer"
import { TextNodeRenderer } from "./TextNodeRenderer"

export interface RenderContext {
	onTextChange: (nodeId: string, content: unknown) => void
}

export function renderNode(node: SceneNode, ctx: RenderContext): React.ReactNode {
	switch (node.type) {
		case "text":
			return (
				<TextNodeRenderer
					key={node.id}
					node={node}
					onContentChange={(content) => {
						ctx.onTextChange(node.id, content)
					}}
				/>
			)
		case "element":
			return renderElementNode(node, ctx)
		default: {
			const _exhaustive: never = node
			return _exhaustive
		}
	}
}
