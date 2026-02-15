import { getComponent } from "@design-editor/components"
import type { ComponentDefinition, ElementNode, InstanceNode, SceneNode } from "@design-editor/core"
import React from "react"

import { TextNodeRenderer } from "./TextNodeRenderer"

export interface RenderContext {
	components: ComponentDefinition[]
	onTextChange: (nodeId: string, content: unknown) => void
}

/**
 * 노드의 자식만 렌더링 (루트 노드의 외부 래퍼는 CanvasRenderer가 생성)
 */
export function renderNodeChildren(node: SceneNode, ctx: RenderContext): React.ReactNode {
	if (node.type === "element" && Array.isArray(node.children)) {
		return node.children.filter((child) => child.visible !== false).map((child) => renderNode(child, ctx))
	}
	return null
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
		case "instance":
			return renderInstance(node, ctx)
		case "element": {
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
		default: {
			const _exhaustive: never = node
			return _exhaustive
		}
	}
}

function renderInstance(instance: InstanceNode, ctx: RenderContext): React.ReactNode {
	const component = ctx.components.find((c) => c.id === instance.componentId)
	if (!component) {
		return (
			<div
				key={instance.id}
				data-node-id={instance.id}
				style={{ ...instance.style, background: "#ff000033", border: "1px dashed red" }}
			>
				Missing Component
			</div>
		)
	}

	const mergedRoot: ElementNode = {
		...component.root,
		id: instance.id,
		style: { ...component.root.style, ...instance.style },
	}

	const applyOverrides = (node: ElementNode): ElementNode => {
		const overrides = instance.overrides
		if (!overrides) return node

		const nodeOverride = overrides[node.id]
		let result = node

		if (nodeOverride) {
			result = {
				...node,
				props: { ...node.props, ...nodeOverride.props },
				style: { ...node.style, ...nodeOverride.style },
			}
		}

		if (Array.isArray(result.children)) {
			result = {
				...result,
				children: result.children.map((child) => {
					if (child.type === "instance") return child
					if (child.type === "text") {
						const textOverride = overrides[child.id]
						if (textOverride?.content) {
							return { ...child, content: textOverride.content }
						}
						return child
					}
					return applyOverrides(child)
				}),
			}
		}

		return result
	}

	return renderNode(applyOverrides(mergedRoot), ctx)
}
