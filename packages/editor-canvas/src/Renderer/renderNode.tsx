import type { ComponentDefinition } from "@design-editor/components"
import type { NodeSnapshot } from "@design-editor/core"
import type React from "react"

import { renderElementNode } from "./ElementNodeRenderer"
import { TextNodeRenderer } from "./TextNodeRenderer"

export type ComponentResolver = (tag: string) => ComponentDefinition | undefined

export interface RenderContext {
	onTextChange: (nodeId: string, content: unknown) => void
	resolveComponent?: ComponentResolver
}

export function renderNode(node: NodeSnapshot, ctx: RenderContext): React.ReactNode {
	switch (node.type) {
		case "text":
			return (
				<TextNodeRenderer
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
