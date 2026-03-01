import { getComponent } from "@design-editor/components"
import type { ElementNode } from "@design-editor/core"
import React from "react"

import { type RenderContext, renderNode } from "./renderNode"

export function renderElementNode(node: ElementNode, ctx: RenderContext): React.ReactNode {
	const Component = getComponent(node.tag)
	const children =
		node.children?.filter((child) => child.visible !== false).map((child) => renderNode(child, ctx)) ?? null

	if (!Component) {
		return React.createElement(
			node.tag,
			{ key: node.id, "data-node-id": node.id, style: node.style, ...node.props },
			children,
		)
	}

	return (
		<Component key={node.id} data-node-id={node.id} style={node.style} {...node.props}>
			{children}
		</Component>
	)
}
