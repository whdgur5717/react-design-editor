import type { SceneNode } from "@design-editor/core"
import type { CSSProperties } from "react"

/**
 * 위치/크기 스타일 제거 (NodeWrapper가 처리하므로)
 */
export function stripPositionStyles(style: CSSProperties | undefined) {
	if (!style) return { width: "100%", height: "100%" }
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { position, left, top, right, bottom, width, height, ...rest } = style
	return { ...rest, width: "100%", height: "100%" }
}

/**
 * 드래그 중 위치 오버라이드 적용
 */
export function applyPositionOverride(node: SceneNode, overrides: Map<string, { x: number; y: number }>) {
	const override = overrides.get(node.id)
	if (!override) return node
	return {
		...node,
		style: { ...node.style, left: override.x, top: override.y },
	}
}
