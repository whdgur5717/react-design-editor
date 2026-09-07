import { CanvasSurface, defaultCanvasStyles } from "@open-editor-sdk/canvas"
import { CanvasInteractionSurface, useEditor, useEditorState } from "@open-editor-sdk/shell"
import type * as React from "react"
import { useLayoutEffect, useRef, useState } from "react"

import { getRegisteredComponentStyles, resolveRegisteredComponent } from "../createEditor/componentRegistration"
import { Portal } from "./portal"

export interface CanvasRenderEnvironment {
	shadowRoot: ShadowRoot
	mountElement: HTMLElement
}

interface CanvasShadowDom extends CanvasRenderEnvironment {
	componentStyleElement: HTMLStyleElement
}

export interface EditorCanvasProps {
	renderCanvasProviders?: (children: React.ReactNode, env: CanvasRenderEnvironment) => React.ReactNode
}

export function EditorCanvas({ renderCanvasProviders }: EditorCanvasProps = {}) {
	const editor = useEditor()
	const shadowHostRef = useRef<HTMLDivElement>(null)
	const [shadowEnv, setShadowEnv] = useState<CanvasShadowDom | null>(null)
	const installedComponentStyleSheetsRef = useRef<CSSStyleSheet[]>([])

	const { page, zoom, panX, panY } = useEditorState((snapshot) => ({
		page: snapshot.document.children.find((candidate) => candidate.id === snapshot.currentPageId) ?? null,
		zoom: snapshot.zoom,
		panX: snapshot.panX,
		panY: snapshot.panY,
	}))

	useLayoutEffect(function setupCanvasShadowRoot() {
		const host = shadowHostRef.current
		if (!host) return

		const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: "open" })
		shadowRoot.querySelector("[data-design-editor-canvas-style-container]")?.remove()

		let baseStyleElement = shadowRoot.querySelector<HTMLStyleElement>("style[data-design-editor-canvas-base-styles]")
		if (!baseStyleElement) {
			baseStyleElement = document.createElement("style")
			baseStyleElement.setAttribute("data-design-editor-canvas-base-styles", "")
		}
		baseStyleElement.textContent = defaultCanvasStyles

		let componentStyleElement = shadowRoot.querySelector<HTMLStyleElement>(
			"style[data-design-editor-registered-component-styles]",
		)
		if (!componentStyleElement) {
			componentStyleElement = document.createElement("style")
			componentStyleElement.setAttribute("data-design-editor-registered-component-styles", "")
		}

		let mountElement = shadowRoot.querySelector<HTMLElement>("[data-design-editor-canvas-mount]")
		if (!mountElement) {
			mountElement = document.createElement("div")
			mountElement.setAttribute("data-design-editor-canvas-mount", "")
		}

		shadowRoot.append(baseStyleElement, componentStyleElement, mountElement)
		setShadowEnv({ shadowRoot, mountElement, componentStyleElement })
	}, [])

	useLayoutEffect(
		function applyCanvasShadowStyles() {
			if (!shadowEnv) return
			const componentStyles = getRegisteredComponentStyles(editor)

			shadowEnv.componentStyleElement.textContent = componentStyles
				.flatMap((style) => {
					if (typeof style === "string") return [style]
					if ("cssText" in style) return [style.cssText]
					return []
				})
				.join("\n")

			if ("adoptedStyleSheets" in shadowEnv.shadowRoot) {
				const previousComponentSheets = installedComponentStyleSheetsRef.current
				const nextComponentSheets =
					typeof CSSStyleSheet === "undefined"
						? []
						: componentStyles.filter((style): style is CSSStyleSheet => style instanceof CSSStyleSheet)
				const retainedSheets = shadowEnv.shadowRoot.adoptedStyleSheets.filter(
					(sheet) => !previousComponentSheets.includes(sheet),
				)

				shadowEnv.shadowRoot.adoptedStyleSheets = [...retainedSheets, ...nextComponentSheets]
				installedComponentStyleSheetsRef.current = nextComponentSheets
			}
		},
		[editor, shadowEnv],
	)

	const canvasSurface = (
		<CanvasSurface
			page={page}
			zoom={zoom}
			panX={panX}
			panY={panY}
			onTextChange={(nodeId, content) => editor.document.applyTextChangeFromCanvas(nodeId, content)}
			onNodeRectsChange={(rects) => editor.geometry.setNodeRectsCache(rects)}
			resolveComponent={(type) => resolveRegisteredComponent(editor, type)}
		/>
	)

	return (
		<div className="de-editor-canvas-host" data-design-editor-canvas-host="">
			<div
				ref={shadowHostRef}
				className="de-editor-canvas-result-host"
				data-design-editor-canvas-shadow-host=""
				data-testid="design-editor-canvas-shadow-host"
			/>
			<Portal container={shadowEnv?.mountElement ?? null}>
				{shadowEnv ? (renderCanvasProviders ? renderCanvasProviders(canvasSurface, shadowEnv) : canvasSurface) : null}
			</Portal>
			<CanvasInteractionSurface />
		</div>
	)
}
