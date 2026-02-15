import type { ElementNode, TextNode } from "@design-editor/core"

function generateId(prefix: string): string {
	return `${prefix}-${crypto.randomUUID()}`
}

export function createFrameNode(left: number, top: number, width: number, height: number): ElementNode {
	return {
		id: generateId("frame"),
		type: "element",
		tag: "div",
		x: left,
		y: top,
		style: {
			width,
			height,
			backgroundColor: "#ffffff",
			border: "1px solid #e0e0e0",
		},
		children: [],
	}
}

export function createTextNode(left: number, top: number, width: number): TextNode {
	return {
		id: generateId("text"),
		type: "text",
		content: {
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", text: "Text" }],
				},
			],
		},
		x: left,
		y: top,
		style: {
			width,
		},
	}
}
