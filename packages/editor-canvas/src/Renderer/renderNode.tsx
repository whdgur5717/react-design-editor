import type { SceneNode } from "@design-editor/core"
import type React from "react"
import type { ComponentType } from "react"

import { renderElementNode } from "./ElementNodeRenderer"
import { renderInstanceNode } from "./InstanceNodeRenderer"
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
			return renderInstanceNode(node, ctx)
		case "element":
			return renderElementNode(node, ctx)
		default: {
			const _exhaustive: never = node
			return _exhaustive
		}
	}
}
