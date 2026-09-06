import type { PageNode } from "@open-editor-sdk/core"
import type { CSSProperties, HTMLAttributes, ReactNode } from "react"
import { expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

import { CanvasSurface } from "./CanvasSurface"

const pageNode: PageNode = {
	id: "page-1",
	name: "Page 1",
	children: [
		{
			id: "root",
			type: "element",
			tag: "div",
			x: 0,
			y: 0,
			style: {
				width: 120,
				height: 80,
			},
			children: [],
		},
	],
}

const sameLayoutDifferentPage: PageNode = {
	...pageNode,
	id: "page-2",
	name: "Page 2",
}

const nestedLayoutPage: PageNode = {
	id: "page-nested",
	name: "Nested layout",
	children: [
		{
			id: "card",
			type: "element",
			tag: "div",
			x: 100,
			y: 80,
			style: {
				position: "relative",
				width: 200,
				height: 100,
			},
			children: [
				{
					id: "button",
					type: "element",
					tag: "button",
					x: 999,
					y: 999,
					style: {
						position: "absolute",
						left: 30,
						top: 12,
						boxSizing: "content-box",
						width: 80,
						height: 20,
						padding: 10,
						border: "2px solid black",
					},
					children: [],
				},
			],
		},
	],
}

const customComponentPage: PageNode = {
	id: "page-custom",
	name: "Custom component",
	children: [
		{
			id: "custom-card",
			type: "element",
			tag: "CustomCard",
			x: 40,
			y: 30,
			style: {
				boxSizing: "content-box",
				width: 160,
				height: 60,
				padding: 8,
				border: "2px solid black",
			},
			children: [],
		},
	],
}

type ForwardingCardProps = HTMLAttributes<HTMLElement> & {
	children?: ReactNode
	style?: CSSProperties
}

function ForwardingCard(props: ForwardingCardProps) {
	return <section {...props} />
}

function NonForwardingCard({ style }: { style?: CSSProperties }) {
	return <section style={style} />
}

test("페이지가 바뀌면 측정된 노드 영역을 최신 callback으로 전달한다", async () => {
	const firstRectChange = vi.fn()
	const currentRectChange = vi.fn()
	const screen = await render(
		<CanvasSurface page={null} zoom={1} panX={0} panY={0} onNodeRectsChange={firstRectChange} />,
	)

	await screen.rerender(
		<CanvasSurface page={pageNode} zoom={1} panX={0} panY={0} onNodeRectsChange={currentRectChange} />,
	)

	await vi.waitFor(() => {
		expect(currentRectChange).toHaveBeenCalledWith(
			expect.objectContaining({
				root: expect.objectContaining({
					width: 120,
					height: 80,
				}),
			}),
		)
	})
})

test("루트 좌표와 자식 DOM 배치로 페이지 기준 노드 영역을 계산한다", async () => {
	const onNodeRectsChange = vi.fn()
	await render(
		<CanvasSurface page={nestedLayoutPage} zoom={2} panX={40} panY={50} onNodeRectsChange={onNodeRectsChange} />,
	)

	await vi.waitFor(() => {
		expect(onNodeRectsChange).toHaveBeenCalledWith(
			expect.objectContaining({
				card: {
					x: 100,
					y: 80,
					width: 200,
					height: 100,
				},
				button: {
					x: 130,
					y: 92,
					width: 104,
					height: 44,
				},
			}),
		)
	})
})

test("측정값이 같아도 페이지가 바뀌면 노드 영역을 다시 전달한다", async () => {
	const onNodeRectsChange = vi.fn()
	const screen = await render(
		<CanvasSurface page={pageNode} zoom={1} panX={0} panY={0} onNodeRectsChange={onNodeRectsChange} />,
	)

	await vi.waitFor(() => {
		expect(onNodeRectsChange).toHaveBeenCalled()
	})

	onNodeRectsChange.mockClear()
	await screen.rerender(
		<CanvasSurface page={sameLayoutDifferentPage} zoom={1} panX={0} panY={0} onNodeRectsChange={onNodeRectsChange} />,
	)

	await vi.waitFor(() => {
		expect(onNodeRectsChange).toHaveBeenCalledWith(
			expect.objectContaining({
				root: expect.objectContaining({
					width: 120,
					height: 80,
				}),
			}),
		)
	})
})

test("등록 컴포넌트가 루트 DOM props를 전달하면 해당 DOM을 측정한다", async () => {
	const onNodeRectsChange = vi.fn()
	await render(
		<CanvasSurface
			page={customComponentPage}
			zoom={1}
			panX={0}
			panY={0}
			onNodeRectsChange={onNodeRectsChange}
			resolveComponent={() => ({
				component: ForwardingCard,
				displayName: "ForwardingCard",
			})}
		/>,
	)

	await vi.waitFor(() => {
		expect(onNodeRectsChange).toHaveBeenCalledWith(
			expect.objectContaining({
				"custom-card": {
					x: 40,
					y: 30,
					width: 180,
					height: 80,
				},
			}),
		)
	})
})

test("등록 컴포넌트가 에디터 DOM props를 전달하지 않아도 wrapper를 측정한다", async () => {
	const onNodeRectsChange = vi.fn()
	await render(
		<CanvasSurface
			page={customComponentPage}
			zoom={1}
			panX={0}
			panY={0}
			onNodeRectsChange={onNodeRectsChange}
			resolveComponent={() => ({
				component: NonForwardingCard,
				displayName: "NonForwardingCard",
			})}
		/>,
	)

	await vi.waitFor(() => {
		expect(onNodeRectsChange).toHaveBeenCalledWith(
			expect.objectContaining({
				"custom-card": {
					x: 40,
					y: 30,
					width: 180,
					height: 80,
				},
			}),
		)
	})
})
