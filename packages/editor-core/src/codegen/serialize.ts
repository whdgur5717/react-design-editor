import type { JSONContent } from "@tiptap/core"

import type { ElementNode, InstanceNode, SceneNode, TextNode } from "../types/node"

/**
 * Codegen 출력 옵션
 */
export interface SerializeOptions {
	/** 들여쓰기 문자 */
	indent?: string
	/** 스타일 출력 형식 */
	styleFormat?: "inline" | "tailwind"
}

const DEFAULT_OPTIONS: Required<SerializeOptions> = {
	indent: "  ",
	styleFormat: "inline",
}

/**
 * CSSProperties를 inline style 문자열로 변환
 */
function serializeStyle(style: Record<string, unknown>): string {
	const entries = Object.entries(style).filter(([, value]) => value !== undefined)
	if (entries.length === 0) return ""

	const styleStr = entries
		.map(([key, value]) => {
			// camelCase를 유지 (JSX 스타일)
			const formattedValue = typeof value === "number" ? value : JSON.stringify(value)
			return `${key}: ${formattedValue}`
		})
		.join(", ")

	return `{{ ${styleStr} }}`
}

/**
 * props를 JSX 속성 문자열로 변환
 */
function serializeProps(props: Record<string, unknown>): string {
	return Object.entries(props)
		.filter(([, value]) => value !== undefined)
		.map(([key, value]) => {
			if (typeof value === "string") {
				return `${key}="${value}"`
			}
			return `${key}={${JSON.stringify(value)}}`
		})
		.join(" ")
}

function extractTextContent(content: JSONContent): string {
	if (content.text) return content.text
	if (!content.content) return ""
	return content.content.map(extractTextContent).join("")
}

function serializeTextNode(node: TextNode, options: Required<SerializeOptions>, depth: number): string {
	const currentIndent = options.indent.repeat(depth)
	const text = extractTextContent(node.content)
	return `${currentIndent}${text}`
}

function serializeInstanceNode(node: InstanceNode, options: Required<SerializeOptions>, depth: number): string {
	const currentIndent = options.indent.repeat(depth)
	const componentName = node.componentId

	if (!node.propValues || Object.keys(node.propValues).length === 0) {
		return `${currentIndent}<${componentName} />`
	}

	const propsStr = serializeProps(node.propValues)
	return `${currentIndent}<${componentName} ${propsStr} />`
}

function serializeSceneNode(node: SceneNode, options: Required<SerializeOptions>, depth: number): string {
	switch (node.type) {
		case "element":
			return serializeElementNode(node, options, depth)
		case "text":
			return serializeTextNode(node, options, depth)
		case "instance":
			return serializeInstanceNode(node, options, depth)
		default: {
			const _exhaustive: never = node
			return _exhaustive
		}
	}
}

/**
 * ElementNode를 JSX 코드로 serialize
 */
export function serializeNode(node: ElementNode, options: SerializeOptions = {}): string {
	const opts = { ...DEFAULT_OPTIONS, ...options }
	return serializeElementNode(node, opts, 0)
}

function serializeElementNode(node: ElementNode, options: Required<SerializeOptions>, depth: number): string {
	const { indent } = options
	const currentIndent = indent.repeat(depth)

	const { tag, props = {}, style, children } = node

	// 속성 문자열 생성
	const attrs: string[] = []

	if (Object.keys(props).length > 0) {
		attrs.push(serializeProps(props))
	}

	if (style && Object.keys(style).length > 0) {
		attrs.push(`style=${serializeStyle(style as Record<string, unknown>)}`)
	}

	const attrStr = attrs.length > 0 ? ` ${attrs.join(" ")}` : ""

	// 자식이 없는 경우
	if (!children || (Array.isArray(children) && children.length === 0)) {
		return `${currentIndent}<${tag}${attrStr} />`
	}

	// 텍스트 자식인 경우
	if (typeof children === "string") {
		return `${currentIndent}<${tag}${attrStr}>${children}</${tag}>`
	}

	const childrenStr = children
		.filter((child) => child.visible !== false)
		.map((child) => serializeSceneNode(child, options, depth + 1))
		.join("\n")

	return `${currentIndent}<${tag}${attrStr}>\n${childrenStr}\n${currentIndent}</${tag}>`
}

/**
 * ElementNode를 완전한 React 컴포넌트 코드로 serialize
 */
export function serializeDocument(
	node: ElementNode,
	componentName: string = "Component",
	options: SerializeOptions = {},
): string {
	const jsx = serializeNode(node, options)

	return `export function ${componentName}() {
  return (
${jsx
	.split("\n")
	.map((line) => `    ${line}`)
	.join("\n")}
  );
}`
}
