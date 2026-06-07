import type { ActionRegistry } from "../commands/ActionRegistry"
import type { KeybindingRegistry } from "../keybindings"
import type { ToolRegistry } from "../tools/ToolRegistry"
import type { EditorExtension, EditorExtensionContext } from "./types"

interface ExtensionInstallerRegistries {
	tools: ToolRegistry
	actions: ActionRegistry
	keybindings: KeybindingRegistry
}

export function installEditorExtension(
	extension: EditorExtension,
	registries: ExtensionInstallerRegistries,
	context: EditorExtensionContext,
) {
	for (const contribution of extension.tools?.(context) ?? []) {
		registries.tools.register(contribution.id, contribution.tool)
	}

	for (const contribution of extension.actions?.(context) ?? []) {
		registries.actions.register(contribution.id, contribution.handler)
	}

	for (const keybinding of extension.keybindings ?? []) {
		registries.keybindings.register(keybinding)
	}
}
