import "../styles/index.css"
import "./EditorCanvas.test.css"

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

test("SDK 조합은 Shadow DOM canvas와 shell UI를 렌더링한다", async () => {
	const screen = await renderSdkEditorAtDesktopSize()

	await expect.element(page.getByTestId("design-editor-canvas-shadow-host")).toBeVisible()
	await expect.element(page.getByTestId("design-editor-event-target")).toBeVisible()
	await expect.element(screen.getByTitle("Select")).toBeVisible()
	await expect.element(screen.getByText("Page 1")).toBeVisible()
	await expect.element(screen.getByTestId("properties-empty")).toBeVisible()

	await expect.element(page.getByTestId("canvas-container")).toBeInTheDocument()
	await expect.element(page.getByText("Hello, World!")).toBeVisible()
})

test("SDK canvas는 ShadowRoot mount와 surface에 실제 레이아웃 높이를 가진다", async () => {
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

test("SDK canvas는 ShadowRoot 안에 canvas 전용 style과 mount만 구성한다", async () => {
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

test("SDK 조합은 layer 선택 후 properties와 selection overlay를 갱신한다", async () => {
	await renderSdkEditorAtDesktopSize()

	await expect.element(page.getByTestId("canvas-container")).toBeInTheDocument()

	await page.getByTestId("layer-row-root").click()

	await expect.element(page.getByTestId("design-tab")).toBeVisible()
	await expect.element(page.getByTestId("style-width")).toHaveValue("400")
	await expect.element(page.getByTestId("selection-border-root")).toBeVisible()
})

test("SDK canvas는 createEditor에 등록한 함수 컴포넌트를 Shadow DOM에 렌더링한다", async () => {
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
		components: {
			Button: {
				component: Button,
			},
		},
	})

	editor.store.getState().updateNode("root", {
		tag: "Button",
		props: { label: "Registered button" },
		children: [],
	})

	await page.viewport(1280, 720)
	renderSdkEditorWithEditor(editor)

	await expect.element(page.getByTestId("design-editor-canvas-shadow-host")).toBeVisible()
	await expect.element(page.getByText("Registered button")).toBeVisible()
})

test("SDK canvas는 component CSSStyleSheet만 교체하고 ShadowRoot의 다른 adopted sheet는 보존한다", async () => {
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
		components: {
			Box: {
				component: Box,
				styles: firstComponentSheet,
			},
		},
	})
	firstEditor.store.getState().updateNode("root", {
		tag: "Box",
		props: {},
		children: [],
	})

	const secondEditor = createEditor({
		components: {
			Box: {
				component: Box,
				styles: secondComponentSheet,
			},
		},
	})
	secondEditor.store.getState().updateNode("root", {
		tag: "Box",
		props: {},
		children: [],
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
