import type { CSSProperties, ReactNode } from "react"

import { registerComponent } from "../registry"

/**
 * 기본 div 컴포넌트
 */
function Div({ style, children, ...props }: { style?: CSSProperties; children?: ReactNode }) {
	return (
		<div style={style} {...props}>
			{children}
		</div>
	)
}

/**
 * Flex 컨테이너 컴포넌트
 */
function Flex({
	style,
	children,
	direction = "row",
	gap,
	align,
	justify,
	...props
}: {
	style?: CSSProperties
	children?: ReactNode
	direction?: "row" | "column"
	gap?: number
	align?: CSSProperties["alignItems"]
	justify?: CSSProperties["justifyContent"]
}) {
	const flexStyle: CSSProperties = {
		display: "flex",
		flexDirection: direction,
		gap,
		alignItems: align,
		justifyContent: justify,
		...style,
	}

	return (
		<div style={flexStyle} {...props}>
			{children}
		</div>
	)
}

/**
 * Text 컴포넌트
 */
function Text({ style, children, ...props }: { style?: CSSProperties; children?: ReactNode }) {
	return (
		<span style={style} {...props}>
			{children}
		</span>
	)
}

/**
 * Frame 컴포넌트 (Figma의 Frame과 유사)
 */
function Frame({ style, children, ...props }: { style?: CSSProperties; children?: ReactNode }) {
	const frameStyle: CSSProperties = {
		position: "relative",
		...style,
	}

	return (
		<div style={frameStyle} {...props}>
			{children}
		</div>
	)
}

// 기본 컴포넌트 등록
registerComponent("div", {
	component: Div,
	displayName: "Div",
})

registerComponent("Flex", {
	component: Flex,
	displayName: "Flex",
	defaultStyle: {
		display: "flex",
		flexDirection: "row",
	},
})

registerComponent("Text", {
	component: Text,
	displayName: "Text",
})

registerComponent("Frame", {
	component: Frame,
	displayName: "Frame",
	defaultStyle: {
		position: "relative",
	},
})

export { Div, Flex, Frame,Text }
