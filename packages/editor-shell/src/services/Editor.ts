import type { DocumentNode, EditorTool } from "@open-editor-sdk/core"

import { ActionRegistry } from "../commands/ActionRegistry"
import { CommandHistory } from "../commands/CommandHistory"
import { createBuiltinEditorExtension } from "../extensions/builtinExtension"
import { installEditorExtension } from "../extensions/ExtensionInstaller"
import type { EditorExtension } from "../extensions/types"
import { InteractionController } from "../interaction"
import type { EditorAction } from "../keybindings"
import { KeybindingRegistry } from "../keybindings"
import { createEditorStore, type EditorStoreApi } from "../store/editor"
import { EditorToolFacade } from "../tools/EditorToolFacade"
import { ToolRegistry } from "../tools/ToolRegistry"
import { ClipboardService } from "./ClipboardService"
import { DocumentService } from "./DocumentService"
import { DocumentSessionService } from "./DocumentSessionService"
import { EditorStateApi } from "./EditorStateApi"
import { EditorStateRepository } from "./EditorStateRepository"
import { GeometryService } from "./GeometryService"
import { HistoryService } from "./HistoryService"
import { SelectionService } from "./SelectionService"
import { ViewportService } from "./ViewportService"

export interface CreateEditorRuntimeOptions {
	store?: EditorStoreApi
	document?: DocumentNode
	currentPageId?: string
	extensions?: readonly EditorExtension[]
}

export interface EditorApi {
	state: EditorStateApi
	document: DocumentService
	documentSession: DocumentSessionService
	selection: SelectionService
	viewport: ViewportService
	geometry: GeometryService
	history: HistoryService
	clipboard: ClipboardService
	actions: {
		execute(id: EditorAction): boolean
	}
	tools: {
		setActiveTool(tool: EditorTool): void
	}
	interaction: InteractionController
	start(): void
	dispose(): void
}

export type Editor = EditorApi

export function createEditorRuntime(options: CreateEditorRuntimeOptions = {}): EditorApi {
	const store =
		options.store ??
		createEditorStore({
			document: options.document,
			currentPageId: options.currentPageId,
		})
	const state = new EditorStateApi(store)

	const repository = new EditorStateRepository(store)

	const history = new HistoryService(new CommandHistory(50))
	const document = new DocumentService(repository, repository, history)
	const documentSession = new DocumentSessionService(repository, history)
	const selection = new SelectionService(repository, repository)
	const viewport = new ViewportService(repository)
	const geometry = new GeometryService(repository, repository, repository)
	const actionRegistry = new ActionRegistry()
	const keybindingRegistry = new KeybindingRegistry(() => repository.getSelection())
	const toolRegistry = new ToolRegistry()
	const toolFacade = new EditorToolFacade(repository, repository, history)
	const clipboard = new ClipboardService(repository, history)

	toolRegistry.init(toolFacade)
	const extensionContext = {
		toolFacade,
		services: {
			clipboard,
			document,
			selection,
			history,
		},
	}
	const registries = {
		tools: toolRegistry,
		actions: actionRegistry,
		keybindings: keybindingRegistry,
	}
	installEditorExtension(createBuiltinEditorExtension(), registries, extensionContext)
	for (const extension of options.extensions ?? []) {
		installEditorExtension(extension, registries, extensionContext)
	}

	const interaction = new InteractionController({
		document,
		selection,
		viewport,
		geometry,
		dragPreview: {
			setDragPreview: (preview) => repository.setDragPreview(preview),
		},
		tools: toolRegistry,
		actions: actionRegistry,
		keybindings: keybindingRegistry,
	})

	return {
		state,
		document,
		documentSession,
		selection,
		viewport,
		geometry,
		history,
		clipboard,
		actions: {
			execute: (id) => actionRegistry.execute(id),
		},
		tools: {
			setActiveTool: (tool) => toolRegistry.setActiveTool(tool),
		},
		interaction,
		start: () => interaction.start(),
		dispose: () => interaction.dispose(),
	}
}
