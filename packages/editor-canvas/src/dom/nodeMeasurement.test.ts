import type { PageNode } from "@design-editor/core"
import { describe, expect, it } from "vitest"

import { collectNodeRects } from "./nodeMeasurement"

describe("노드 영역 측정", () => {
	it("자식 노드 위치는 부모 좌표와 DOM 배치를 합산하고 크기는 border box로 측정한다", () => {
		const root = document.createElement("div")
		const cardWrapper = document.createElement("div")
		const card = document.createElement("div")
		const buttonWrapper = document.createElement("div")
		const button = document.createElement("button")

		cardWrapper.dataset.nodeId = "card"
		cardWrapper.dataset.nodeMeasureId = "card"
		buttonWrapper.dataset.nodeId = "button"
		buttonWrapper.dataset.nodeMeasureId = "button"
		buttonWrapper.style.display = "contents"

		card.style.position = "relative"
		card.style.width = "200px"
		card.style.height = "100px"
		card.style.transform = "translateX(999px)"

		button.style.position = "absolute"
		button.style.left = "30px"
		button.style.top = "12px"
		button.style.boxSizing = "content-box"
		button.style.width = "80px"
		button.style.height = "20px"
		button.style.padding = "10px"
		button.style.border = "2px solid black"
		button.style.transform = "scale(3)"

		buttonWrapper.append(button)
		card.append(buttonWrapper)
		cardWrapper.append(card)
		root.append(cardWrapper)
		document.body.append(root)

		const page: PageNode = {
			id: "page-1",
			name: "Page 1",
			children: [
				{
					id: "card",
					type: "element",
					tag: "div",
					x: 100,
					y: 80,
					children: [
						{
							id: "button",
							type: "element",
							tag: "button",
							x: 999,
							y: 999,
						},
					],
				},
			],
		}

		try {
			const rects = collectNodeRects(root, page)

			expect(rects.button).toEqual({
				x: 130,
				y: 92,
				width: 104,
				height: 44,
			})
		} finally {
			root.remove()
		}
	})
})
