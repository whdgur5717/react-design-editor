import { getComponent } from "@design-editor/components"
import type {
	CanvasGesture,
	ComponentDefinition,
	ElementNode,
	GestureType,
	InstanceNode,
	PageNode,
	SceneNode,
} from "@design-editor/core"
import React from "react"

import { NodeWrapper } from "./NodeWrapper"
import { TextNodeRenderer } from "./TextNodeRenderer"

interface CanvasRendererProps {
	page: PageNode
	components: ComponentDefinition[]
	selectedIds: string[]
	positionOverrides: Map<string, { x: number; y: number }>
	onResizeStart: () => void
	onResizeEnd: (nodeId: string, width: number, height: number) => void
	sendGesture: <T extends GestureType>(gesture: CanvasGesture<T>) => void
}

// 노드에 위치 오버라이드 적용
function applyPositionOverride(node: SceneNode, positionOverrides: Map<string, { x: number; y: number }>) {
	const override = positionOverrides.get(node.id)
	if (!override) return node
	return {
		...node,
		style: { ...node.style, left: override.x, top: override.y },
	}
}

export function CanvasRenderer({
	page,
	components,
	selectedIds,
	positionOverrides,
	onResizeStart,
	onResizeEnd,
	sendGesture,
}: CanvasRendererProps) {
	return (
		<>
			{page.children
				.filter((child) => child.visible !== false)
				.map((child) => {
					const effectiveNode = applyPositionOverride(child, positionOverrides)
					return (
						<NodeWrapper
							key={child.id}
							node={effectiveNode}
							isSelected={selectedIds.includes(child.id)}
							onResizeStart={onResizeStart}
							onResizeEnd={(width, height) => onResizeEnd(child.id, width, height)}
						>
							{renderNode(child, components, selectedIds, positionOverrides, onResizeStart, onResizeEnd, sendGesture)}
						</NodeWrapper>
					)
				})}
		</>
	)
}

/**
 * 인스턴스 노드를 렌더링 - 컴포넌트 정의를 참조하여 렌더링
 */
function renderInstance(
	instance: InstanceNode,
	components: ComponentDefinition[],
	selectedIds: string[],
	positionOverrides: Map<string, { x: number; y: number }>,
	onResizeStart: () => void,
	onResizeEnd: (nodeId: string, width: number, height: number) => void,
	sendGesture: <T extends GestureType>(gesture: CanvasGesture<T>) => void,
): React.ReactNode {
	const component = components.find((c) => c.id === instance.componentId)
	if (!component) {
		// 컴포넌트를 찾을 수 없으면 placeholder 렌더링
		return <div style={{ ...instance.style, background: "#ff000033", border: "1px dashed red" }}>Missing Component</div>
	}

	// 컴포넌트 루트에 인스턴스 스타일 적용
	const mergedRoot: ElementNode = {
		...component.root,
		style: { ...component.root.style, ...instance.style },
	}

	// 오버라이드 적용
	const rootWithOverrides = applyOverrides(mergedRoot, instance.overrides)

	return renderNode(
		rootWithOverrides,
		components,
		selectedIds,
		positionOverrides,
		onResizeStart,
		onResizeEnd,
		sendGesture,
	)
}

/**
 * 오버라이드 적용
 */
function applyOverrides(node: ElementNode, overrides?: InstanceNode["overrides"]): ElementNode {
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
				return applyOverrides(child, overrides)
			}),
		}
	}

	return result
}

function renderNode(
	node: SceneNode,
	components: ComponentDefinition[],
	selectedIds: string[],
	positionOverrides: Map<string, { x: number; y: number }>,
	onResizeStart: () => void,
	onResizeEnd: (nodeId: string, width: number, height: number) => void,
	sendGesture: <T extends GestureType>(gesture: CanvasGesture<T>) => void,
): React.ReactNode {
	// 텍스트 노드
	if (node.type === "text") {
		return (
			<TextNodeRenderer
				node={node}
				onContentChange={(content) => {
					sendGesture({
						type: "textchange",
						state: "ended",
						nodeId: node.id,
						payload: { content },
					})
				}}
			/>
		)
	}

	// 인스턴스인 경우 컴포넌트 참조하여 렌더링
	if (node.type === "instance") {
		return renderInstance(node, components, selectedIds, positionOverrides, onResizeStart, onResizeEnd, sendGesture)
	}

	const Component = getComponent(node.tag)

	// position 스타일은 NodeWrapper에서 적용하므로 컴포넌트에서는 제외
	// width/height도 wrapper에 적용되므로 100%로 채움
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { position, left, top, right, bottom, width, height, ...restStyle } = node.style ?? {}
	const contentStyle = { ...restStyle, width: "100%", height: "100%" }

	if (!Component) {
		// 컴포넌트가 없으면 HTML 태그로 렌더링
		return React.createElement(
			node.tag,
			{ style: contentStyle, ...node.props },
			renderChildren(node.children, components, selectedIds, positionOverrides, onResizeStart, onResizeEnd, sendGesture),
		)
	}

	return (
		<Component style={contentStyle} {...node.props}>
			{renderChildren(node.children, components, selectedIds, positionOverrides, onResizeStart, onResizeEnd, sendGesture)}
		</Component>
	)
}

function renderChildren(
	children: ElementNode["children"],
	components: ComponentDefinition[],
	selectedIds: string[],
	positionOverrides: Map<string, { x: number; y: number }>,
	onResizeStart: () => void,
	onResizeEnd: (nodeId: string, width: number, height: number) => void,
	sendGesture: <T extends GestureType>(gesture: CanvasGesture<T>) => void,
): React.ReactNode {
	if (!children) return null

	return children
		.filter((child) => child.visible !== false)
		.map((child) => {
			const effectiveNode = applyPositionOverride(child, positionOverrides)
			return (
				<NodeWrapper
					key={child.id}
					node={effectiveNode}
					isSelected={selectedIds.includes(child.id)}
					onResizeStart={onResizeStart}
					onResizeEnd={(width, height) => onResizeEnd(child.id, width, height)}
				>
					{renderNode(child, components, selectedIds, positionOverrides, onResizeStart, onResizeEnd, sendGesture)}
				</NodeWrapper>
			)
		})
}
