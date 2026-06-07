import type { ComponentDefinition, ComponentProps } from "@design-editor/components"
import { componentRegistry } from "@design-editor/components"
import type { EditorApi } from "@design-editor/shell"
import type * as React from "react"

export type CanvasStyleSource = string | CSSStyleSheet | { id?: string; cssText: string }

export interface EditorComponentRegistration {
	component: React.ComponentType<ComponentProps>
	displayName?: string
	defaultProps?: Record<string, unknown>
	defaultStyle?: React.CSSProperties
	styles?: CanvasStyleSource | CanvasStyleSource[]
}

export type EditorComponentRegistrationMap = Record<string, EditorComponentRegistration>

interface EditorComponentRegistrations {
	components: Map<string, ComponentDefinition>
	styles: CanvasStyleSource[]
}

const editorComponentRegistrations = new WeakMap<EditorApi, EditorComponentRegistrations>()

export function registerEditorComponents(editor: EditorApi, components: EditorComponentRegistrationMap) {
	const registered: EditorComponentRegistrations = {
		components: new Map(),
		styles: [],
	}

	for (const [type, registration] of Object.entries(components)) {
		registered.components.set(type, {
			component: registration.component,
			displayName: registration.displayName ?? registration.component.displayName ?? registration.component.name ?? type,
			defaultProps: registration.defaultProps,
			defaultStyle: registration.defaultStyle,
		})

		if (Array.isArray(registration.styles)) {
			registered.styles.push(...registration.styles)
		} else if (registration.styles) {
			registered.styles.push(registration.styles)
		}
	}

	editorComponentRegistrations.set(editor, registered)
}

export function getRegisteredComponentStyles(editor: EditorApi): CanvasStyleSource[] {
	return editorComponentRegistrations.get(editor)?.styles ?? []
}

export function resolveRegisteredComponent(editor: EditorApi, type: string): ComponentDefinition | undefined {
	return editorComponentRegistrations.get(editor)?.components.get(type) ?? componentRegistry.get(type)
}
