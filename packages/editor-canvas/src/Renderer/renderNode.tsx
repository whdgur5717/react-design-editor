import { getComponent } from "@design-editor/components"
import type { InstanceNode, SceneNode } from "@design-editor/core"
import React, { type ComponentType } from "react"

import { TextNodeRenderer } from "./TextNodeRenderer"

export interface RenderContext {
	codeComponents: Record<string, ComponentType<Record<string, unknown>>>
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

class CodeComponentErrorBoundary extends React.Component<
	{ children: React.ReactNode; nodeId: string },
	{ error: string | null }
> {
	override state: { error: string | null } = { error: null }

	static getDerivedStateFromError(error: Error) {
		return { error: error.message }
	}

	override render() {
		if (this.state.error) {
			return (
				<div data-node-id={this.props.nodeId} style={{ color: "red", padding: 8, fontSize: 12 }}>
					Error: {this.state.error}
				</div>
			)
		}
		return this.props.children
	}
}

function renderInstance(instance: InstanceNode, ctx: RenderContext): React.ReactNode {
	const CodeComponent = ctx.codeComponents[instance.componentId]
	if (CodeComponent) {
		return (
			<CodeComponentErrorBoundary key={instance.id} nodeId={instance.id}>
				<div data-node-id={instance.id} style={instance.style}>
					<CodeComponent {...(instance.propValues ?? {})} />
				</div>
			</CodeComponentErrorBoundary>
		)
	}

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
