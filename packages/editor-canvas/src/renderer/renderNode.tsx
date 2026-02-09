import { getComponent } from "@design-editor/components"
import type {
	CanvasGesture,
	ComponentDefinition,
	ElementNode,
	GestureType,
	InstanceNode,
	SceneNode,
} from "@design-editor/core"
import React from "react"

import { NodeWrapper } from "./NodeWrapper"
import { TextNodeRenderer } from "./TextNodeRenderer"
import { applyPositionOverride, stripPositionStyles } from "./utils"

export interface RenderContext {
	components: ComponentDefinition[]
	selectedIds: string[]
	positionOverrides: Map<string, { x: number; y: number }>
	onResizeStart: () => void
	onResizeEnd: (nodeId: string, width: number, height: number) => void
	sendGesture: <T extends GestureType>(gesture: CanvasGesture<T>) => void
}

export function renderNode(node: SceneNode, ctx: RenderContext): React.ReactNode {
	switch (node.type) {
		case "text":
			return (
				<TextNodeRenderer
					node={node}
					onContentChange={(content) => {
						ctx.sendGesture({
							type: "textchange",
							state: "ended",
							nodeId: node.id,
							payload: { content },
						})
					}}
				/>
			)
		case "instance":
			return renderInstance(node, ctx)
		case "element": {
			const Component = getComponent(node.tag)
			const contentStyle = stripPositionStyles(node.style)
			const children =
				node.children
					?.filter((child) => child.visible !== false)
					.map((child) => {
						const effectiveNode = applyPositionOverride(child, ctx.positionOverrides)
						return (
							<NodeWrapper
								key={child.id}
								node={effectiveNode}
								isSelected={ctx.selectedIds.includes(child.id)}
								onResizeStart={ctx.onResizeStart}
								onResizeEnd={(width, height) => ctx.onResizeEnd(child.id, width, height)}
							>
								{renderNode(child, ctx)}
							</NodeWrapper>
						)
					}) ?? null

			if (!Component) {
				return React.createElement(node.tag, { style: contentStyle, ...node.props }, children)
			}

			return (
				<Component style={contentStyle} {...node.props}>
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

/**
 * 인스턴스 노드를 렌더링 - 컴포넌트 정의를 참조하여 렌더링
 */
function renderInstance(instance: InstanceNode, ctx: RenderContext): React.ReactNode {
	const component = ctx.components.find((c) => c.id === instance.componentId)
	if (!component) {
		return <div style={{ ...instance.style, background: "#ff000033", border: "1px dashed red" }}>Missing Component</div>
	}

	// 컴포넌트 루트에 인스턴스 스타일 적용
	const mergedRoot: ElementNode = {
		...component.root,
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

		// 자식에도 재귀적으로 오버라이드 적용
		if (Array.isArray(result.children)) {
			result = {
				...result,
				children: result.children.map((child) => {
					if (child.type === "instance") return child
					if (child.type === "text") {
						// TextNode의 content 오버라이드 적용
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
