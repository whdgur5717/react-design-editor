import type { NodeRect, PageNode } from "@open-editor-sdk/core"
import { describe, expect, it } from "vitest"

import { hitTestNodeIdInPage } from "./hitTest"

describe("노드 hit test", () => {
	it("포인터 좌표를 페이지 좌표로 변환한 뒤 캐시된 노드 영역과 비교한다", () => {
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
