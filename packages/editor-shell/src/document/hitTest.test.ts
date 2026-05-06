import type { NodeRect, PageNode } from "@design-editor/core"
import { describe, expect, it } from "vitest"

import { hitTestNodeIdInPage } from "./hitTest"

describe("hitTestNodeIdInPage", () => {
	it("converts pointer coordinates to page coordinates before checking cached rects", () => {
		const page: PageNode = {
			id: "page-1",
			name: "Page 1",
			children: [
				{
					id: "card",
					type: "element",
					tag: "div",
				},
			],
		}
		const cache: Record<string, NodeRect> = {
			card: {
				x: 100,
				y: 80,
				width: 200,
				height: 120,
			},
		}

		expect(hitTestNodeIdInPage(page, cache, 2, 10, 20, 510, 300)).toBe("card")
	})
})
