import type { ElementNode } from "@design-editor/core"

function generateId(prefix: string): string {
	return `${prefix}-${crypto.randomUUID()}`
}

export function createFrameNode(left: number, top: number, width: number, height: number): ElementNode {
	return {
		id: generateId("frame"),
		type: "element",
		tag: "div",
		style: {
			position: "absolute",
			left,
			top,
			width,
			height,
			backgroundColor: "#ffffff",
			border: "1px solid #e0e0e0",
		},
		children: [],
	}
}

export function createTextNode(left: number, top: number, width: number): ElementNode {
	return {
		id: generateId("text"),
		type: "element",
		tag: "p",
		style: {
			position: "absolute",
			left,
			top,
			width,
			fontSize: 16,
			color: "#000000",
		},
		children: "Text",
	}
}
