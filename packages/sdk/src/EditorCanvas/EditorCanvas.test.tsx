import "../styles/index.css"
import "./EditorCanvas.test.css"

import type { DocumentNode, SceneNode } from "@design-editor/core"
import type { CSSProperties, ReactNode } from "react"
import { expect, test } from "vitest"
import { page } from "vitest/browser"
import { render } from "vitest-browser-react"

import { createEditor } from "../createEditor"
import { EditorCanvas } from "../EditorCanvas"
import { EditorProvider } from "../EditorProvider"
import { EditorRoot } from "../EditorRoot"
import { LayersPanel } from "../LayersPanel"
import { PropertiesPanel } from "../PropertiesPanel"
import { Toolbar } from "../Toolbar"

function createDocumentWithRoot(root: SceneNode): DocumentNode {
	return {
		id: "doc-root",
		children: [
			{
				id: "page-1",
				name: "Page 1",
				children: [root],
			},
		],
		meta: {
			name: "Test document",
		},
	}
}

function createDefaultRoot(overrides: Partial<Extract<SceneNode, { type: "element" }>> = {}): SceneNode {
	return {
		id: "root",
		type: "element",
		tag: "div",
		x: 0,
		y: 0,
		style: {
			width: 400,
			height: 300,
			backgroundColor: "#ffffff",
			padding: 16,
		},
		children: [
			{
				id: "text-1",
				type: "text",
				content: {
					type: "doc",
					content: [
						{
							type: "paragraph",
							content: [{ type: "text", text: "Hello, World!" }],
						},
					],
				},
				style: {
					fontSize: 24,
					fontWeight: "bold",
					color: "#1a1a1a",
				},
			},
		],
		...overrides,
	}
}

function renderSdkEditor() {
	const editor = createEditor()
	return renderSdkEditorWithEditor(editor)
}

function renderSdkEditorWithEditor(editor: ReturnType<typeof createEditor>) {
	return render(
		<EditorProvider editor={editor}>
			<EditorRoot>
				<Toolbar />
				<LayersPanel />
				<EditorCanvas />
				<PropertiesPanel />
			</EditorRoot>
		</EditorProvider>,
	)
}

async function renderSdkEditorAtDesktopSize() {
	await page.viewport(1280, 720)
	return renderSdkEditor()
}

test("에디터 화면은 Shadow DOM canvas와 shell UI를 함께 렌더링한다", async () => {
	const screen = await renderSdkEditorAtDesktopSize()

	await expect.element(page.getByTestId("design-editor-canvas-shadow-host")).toBeVisible()
	await expect.element(page.getByTestId("design-editor-event-target")).toBeVisible()
	await expect.element(screen.getByTitle("Select")).toBeVisible()
	await expect.element(screen.getByText("Page 1")).toBeVisible()
	await expect.element(screen.getByTestId("properties-empty")).toBeVisible()

	await expect.element(page.getByTestId("canvas-container")).toBeInTheDocument()
	await expect.element(page.getByText("Hello, World!")).toBeVisible()
})

test("캔버스 영역은 실제 레이아웃 높이를 가진다", async () => {
	await renderSdkEditorAtDesktopSize()
	await expect.element(page.getByTestId("canvas-container")).toBeVisible()

	const host = document.querySelector<HTMLElement>("[data-design-editor-canvas-shadow-host]")
	const shadowRoot = host?.shadowRoot
	const mountElement = shadowRoot?.querySelector<HTMLElement>("[data-design-editor-canvas-mount]")
	const surface = shadowRoot?.querySelector<HTMLElement>(".de-canvas-surface")

	expect(host).toBeInstanceOf(HTMLElement)
	expect(shadowRoot).toBeInstanceOf(ShadowRoot)
	expect(mountElement?.getBoundingClientRect().height).toBeGreaterThan(0)
	expect(surface?.getBoundingClientRect().height).toBeGreaterThan(0)
	expect(shadowRoot?.querySelector("iframe")).toBeNull()
})

test("캔버스 ShadowRoot에는 전용 style과 mount만 들어간다", async () => {
	await renderSdkEditorAtDesktopSize()

	const host = document.querySelector<HTMLElement>("[data-design-editor-canvas-shadow-host]")
	const shadowRoot = host?.shadowRoot
	const baseStyle = shadowRoot?.querySelector<HTMLStyleElement>("style[data-design-editor-canvas-base-styles]")
	const componentStyles = shadowRoot?.querySelector<HTMLStyleElement>(
		"style[data-design-editor-registered-component-styles]",
	)
	const mountElement = shadowRoot?.querySelector<HTMLElement>("[data-design-editor-canvas-mount]")

	expect(shadowRoot?.querySelector("[data-design-editor-canvas-style-container]")).toBeNull()
	expect(baseStyle).toBeInstanceOf(HTMLStyleElement)
	expect(baseStyle?.textContent).toContain("[data-design-editor-canvas-mount]")
	expect(componentStyles).toBeInstanceOf(HTMLStyleElement)
	expect(componentStyles?.textContent).toBe("")
	expect(mountElement).toBeInstanceOf(HTMLElement)
	expect(mountElement?.parentElement).toBeNull()
})

test("레이어를 선택하면 properties panel과 선택 overlay가 갱신된다", async () => {
	await renderSdkEditorAtDesktopSize()

	await expect.element(page.getByTestId("canvas-container")).toBeInTheDocument()

	await page.getByTestId("layer-row-root").click()

	await expect.element(page.getByTestId("design-tab")).toBeVisible()
	await expect.element(page.getByTestId("style-width")).toHaveValue("400")
	await expect.element(page.getByTestId("selection-border-root")).toBeVisible()
})

test("createEditor에 등록한 함수 컴포넌트가 캔버스 Shadow DOM에 렌더링된다", async () => {
	function Button({
		children,
		label = "Registered button",
		style,
		...props
	}: {
		children?: ReactNode
		label?: string
		style?: CSSProperties
	}) {
		return (
			<button type="button" style={style} {...props}>
				{children ?? label}
			</button>
		)
	}

	const editor = createEditor({
		document: createDocumentWithRoot(
			createDefaultRoot({
				tag: "Button",
				props: { label: "Registered button" },
				children: [],
			}),
		),
		currentPageId: "page-1",
		components: {
			Button: {
				component: Button,
			},
		},
	})

	await page.viewport(1280, 720)
	renderSdkEditorWithEditor(editor)

	await expect.element(page.getByTestId("design-editor-canvas-shadow-host")).toBeVisible()
	await expect.element(page.getByText("Registered button")).toBeVisible()
})

test("컴포넌트 CSSStyleSheet를 교체해도 ShadowRoot의 다른 adopted sheet는 유지된다", async () => {
	function Box({ style, ...props }: { style?: CSSProperties }) {
		return <div style={style} {...props} />
	}

	const firstComponentSheet = new CSSStyleSheet()
	firstComponentSheet.replaceSync(".first-component-sheet { color: red; }")
	const secondComponentSheet = new CSSStyleSheet()
	secondComponentSheet.replaceSync(".second-component-sheet { color: blue; }")
	const externalSheet = new CSSStyleSheet()
	externalSheet.replaceSync(".external-sheet { color: green; }")

	const firstEditor = createEditor({
		document: createDocumentWithRoot(
			createDefaultRoot({
				tag: "Box",
				props: {},
				children: [],
			}),
		),
		currentPageId: "page-1",
		components: {
			Box: {
				component: Box,
				styles: firstComponentSheet,
			},
		},
	})

	const secondEditor = createEditor({
		document: createDocumentWithRoot(
			createDefaultRoot({
				tag: "Box",
				props: {},
				children: [],
			}),
		),
		currentPageId: "page-1",
		components: {
			Box: {
				component: Box,
				styles: secondComponentSheet,
			},
		},
	})

	await page.viewport(1280, 720)
	const screen = await renderSdkEditorWithEditor(firstEditor)
	await expect.element(page.getByTestId("canvas-container")).toBeInTheDocument()

	const host = document.querySelector<HTMLElement>("[data-design-editor-canvas-shadow-host]")
	const shadowRoot = host?.shadowRoot
	expect(shadowRoot).toBeInstanceOf(ShadowRoot)
	expect(shadowRoot?.adoptedStyleSheets).toContain(firstComponentSheet)

	shadowRoot!.adoptedStyleSheets = [...shadowRoot!.adoptedStyleSheets, externalSheet]

	await screen.rerender(
		<EditorProvider editor={secondEditor}>
			<EditorRoot>
				<Toolbar />
				<LayersPanel />
				<EditorCanvas />
				<PropertiesPanel />
			</EditorRoot>
		</EditorProvider>,
	)
	await expect.element(page.getByTestId("canvas-container")).toBeInTheDocument()

	expect(shadowRoot?.adoptedStyleSheets).not.toContain(firstComponentSheet)
	expect(shadowRoot?.adoptedStyleSheets).toContain(secondComponentSheet)
	expect(shadowRoot?.adoptedStyleSheets).toContain(externalSheet)
})
