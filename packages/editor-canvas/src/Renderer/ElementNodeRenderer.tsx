import { componentRegistry } from "@design-editor/components"
import type { ElementNode } from "@design-editor/core"
import React from "react"

import { type RenderContext, renderNode } from "./renderNode"

export function renderElementNode(node: ElementNode, ctx: RenderContext): React.ReactNode {
	const definition = ctx.resolveComponent?.(node.tag) ?? componentRegistry.get(node.tag)
	const Component = definition?.component
	const renderedChildren =
		node.children
			?.filter((child) => child.visible !== false)
			.map((child) => (
				<div key={child.id} data-node-id={child.id} data-node-measure-id={child.id} style={{ display: "contents" }}>
					{renderNode(child, ctx)}
				</div>
			)) ?? []
	const children = renderedChildren.length > 0 ? renderedChildren : null
	const style = {
		...definition?.defaultStyle,
		...node.style,
	}
	const props = {
		...definition?.defaultProps,
		...node.props,
		style,
	}

	if (!Component) {
		return React.createElement(node.tag, props, children)
	}

	return React.createElement(Component, props, children)
}
