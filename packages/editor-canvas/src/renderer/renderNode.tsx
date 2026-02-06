import { getComponent } from "@design-editor/components"
import type { SceneNode } from "@design-editor/core"
import React, { type ReactNode } from "react"

import { NodeWrapper } from "./NodeWrapper"
import { applyPositionOverride, stripPositionStyles } from "./utils"

export interface RenderContext {
	selectedIds: string[]
	positionOverrides: Map<string, { x: number; y: number }>
	onResizeStart: () => void
	onResizeEnd: (nodeId: string, width: number, height: number) => void
}

/**
 * SceneNode를 재귀적으로 렌더링
 *
 * NOTE: InstanceNode 렌더링이 미구현 상태라 SceneNode 타입 호환을 위한
 * 분기 처리가 존재함. InstanceNode 구현 시 정리 필요.
 */
export function renderNode(node: SceneNode, ctx: RenderContext) {
	if (node.type === "instance") {
		// TODO: InstanceNode 렌더링 구현
		return null
	}

	const Component = getComponent(node.tag)
	const contentStyle = stripPositionStyles(node.style)

	const children = node.children
	let renderedChildren: ReactNode

	if (typeof children === "string" || children === undefined) {
		renderedChildren = children
	} else {
		renderedChildren = children.filter((child) => child.visible !== false).map((child) => renderNode(child, ctx))
	}

	const content = !Component ? (
		React.createElement(node.tag, { style: contentStyle, ...node.props }, renderedChildren)
	) : (
		<Component style={contentStyle} {...node.props}>
			{renderedChildren}
		</Component>
	)

	return (
		<NodeWrapper
			key={node.id}
			node={applyPositionOverride(node, ctx.positionOverrides)}
			isSelected={ctx.selectedIds.includes(node.id)}
			onResizeStart={ctx.onResizeStart}
			onResizeEnd={(width, height) => ctx.onResizeEnd(node.id, width, height)}
		>
			{content}
		</NodeWrapper>
	)
}
