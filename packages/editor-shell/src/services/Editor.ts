import type { EditorTool, NodeRect, PageNode, SceneNode } from "@design-editor/core"
import { type AnyActor, createActor } from "xstate"

import { ActionRegistry } from "../commands/ActionRegistry"
import { CommandHistory } from "../commands/CommandHistory"
import { EditorReceiverImpl } from "../commands/EditorReceiverImpl"
import type { Command, NodeLocation } from "../commands/types"
import { createPointerMachine } from "../interaction"
import { KeybindingRegistry } from "../keybindings"
import { createEditorStore, type EditorStoreApi } from "../store/editor"
import { FrameTool } from "../tools/FrameTool"
import { SelectTool } from "../tools/SelectTool"
import { TextTool } from "../tools/TextTool"
import { ToolRegistry } from "../tools/ToolRegistry"
import { ToolServiceImpl } from "../tools/ToolServiceImpl"
import { ApplyCanvasTextChangeUsecase } from "../usecases/ApplyCanvasTextChangeUsecase"
import { CodeComponentUsecase } from "../usecases/CodeComponentUsecase"
import { DeleteSelectionUsecase } from "../usecases/DeleteSelectionUsecase"
import { DuplicateSelectionUsecase } from "../usecases/DuplicateSelectionUsecase"
import { NodePropertyUsecase } from "../usecases/NodePropertyUsecase"
import { SelectAllUsecase } from "../usecases/SelectAllUsecase"
import { CanvasBridge } from "./CanvasBridge"

export class Editor {
	readonly store: EditorStoreApi
	readonly commandHistory: CommandHistory
	readonly receiver: EditorReceiverImpl
	readonly toolRegistry: ToolRegistry
	readonly actionRegistry: ActionRegistry
	readonly keybindingRegistry: KeybindingRegistry
	readonly canvas: CanvasBridge
	private pointerActor: AnyActor
	private deleteSelection: DeleteSelectionUsecase
	private duplicateSelection: DuplicateSelectionUsecase
	private selectAll: SelectAllUsecase
	private applyCanvasTextChange: ApplyCanvasTextChangeUsecase
	private codeComponent: CodeComponentUsecase
	private nodeProperty: NodePropertyUsecase

	constructor() {
		this.store = createEditorStore()
		this.receiver = new EditorReceiverImpl(this.store)
		this.commandHistory = new CommandHistory(50)
		this.toolRegistry = new ToolRegistry()
		this.actionRegistry = new ActionRegistry()
		this.keybindingRegistry = new KeybindingRegistry(this.store)
		this.canvas = new CanvasBridge()

		// Tool 초기화
		const toolService = new ToolServiceImpl(this.store, this.receiver, this.commandHistory)
		this.toolRegistry.init(toolService)
		this.toolRegistry.register("select", new SelectTool(toolService))
		this.toolRegistry.register("frame", new FrameTool(toolService))
		this.toolRegistry.register("text", new TextTool(toolService))
		this.deleteSelection = new DeleteSelectionUsecase(this.receiver, this.commandHistory)
		this.duplicateSelection = new DuplicateSelectionUsecase(this.receiver, this.commandHistory)
		this.selectAll = new SelectAllUsecase(this.receiver)
		this.applyCanvasTextChange = new ApplyCanvasTextChangeUsecase(this.receiver, this.commandHistory)
		this.codeComponent = new CodeComponentUsecase(this.store)
		this.nodeProperty = new NodePropertyUsecase(this.receiver, this.commandHistory)

		// 액션 등록
		this.actionRegistry.register("history:undo", () => this.commandHistory.undo())
		this.actionRegistry.register("history:redo", () => this.commandHistory.redo())

		this.actionRegistry.register("selection:clear", () => this.receiver.setSelection([]))
		this.actionRegistry.register("selection:all", () => this.selectAll.run())

		this.actionRegistry.register("node:delete", () => this.deleteSelection.run())

		this.actionRegistry.register("node:duplicate", () => this.duplicateSelection.run())

		this.actionRegistry.register("tool:select", () => this.toolRegistry.setActiveTool("select"))
		this.actionRegistry.register("tool:frame", () => this.toolRegistry.setActiveTool("frame"))
		this.actionRegistry.register("tool:text", () => this.toolRegistry.setActiveTool("text"))
		this.actionRegistry.register("tool:shape", () => this.toolRegistry.setActiveTool("shape"))

		// 포인터 상태 머신
		const machine = createPointerMachine(this)
		this.pointerActor = createActor(machine)
	}

	// ── Lifecycle ──

	start() {
		this.pointerActor.start()
	}

	dispose() {
		this.pointerActor.stop()
	}

	// ── Input events — actor를 내부 구현으로 은닉 ──

	sendPointerDown(e: {
		clientX: number
		clientY: number
		pointerId: number
		shiftKey: boolean
		metaKey: boolean
		target: HTMLElement
	}) {
		this.pointerActor.send({
			type: "POINTER_DOWN",
			...e,
		})
	}

	sendPointerMove(e: { clientX: number; clientY: number }) {
		this.pointerActor.send({
			type: "POINTER_MOVE",
			...e,
		})
	}

	sendPointerUp(e: { clientX: number; clientY: number; shiftKey: boolean; metaKey: boolean }) {
		this.pointerActor.send({
			type: "POINTER_UP",
			...e,
		})
	}

	sendKeyDown(e: {
		key: string
		code: string
		shiftKey: boolean
		ctrlKey: boolean
		metaKey: boolean
		altKey: boolean
		target: HTMLElement
	}) {
		this.pointerActor.send({
			type: "KEY_DOWN",
			...e,
		})
	}

	sendWheel(e: {
		deltaX: number
		deltaY: number
		clientX: number
		clientY: number
		ctrlKey: boolean
		metaKey: boolean
	}) {
		this.pointerActor.send({
			type: "WHEEL",
			...e,
		})
	}

	// ── Canvas 동기화 ──

	applyTextChangeFromCanvas(nodeId: string, content: unknown) {
		this.applyCanvasTextChange.run(nodeId, content)
	}

	createCodeComponent(name: string, source: string) {
		return this.codeComponent.create(name, source)
	}

	renameCodeComponent(id: string, name: string) {
		this.codeComponent.rename(id, name)
	}

	updateCodeComponent(id: string, updates: Parameters<CodeComponentUsecase["update"]>[1]) {
		this.codeComponent.update(id, updates)
	}

	removeCodeComponent(id: string) {
		this.codeComponent.remove(id)
	}

	addCodeComponentInstanceToCurrentPage(componentId: string) {
		return this.codeComponent.addInstanceToCurrentPage(componentId)
	}

	updateNodeStyleProperty(
		nodeId: string,
		key: Parameters<NodePropertyUsecase["updateStyle"]>[1],
		value: Parameters<NodePropertyUsecase["updateStyle"]>[2],
	) {
		this.nodeProperty.updateStyle(nodeId, key, value)
	}

	updateNodePosition(nodeId: string, position: Parameters<NodePropertyUsecase["updatePosition"]>[1]) {
		this.nodeProperty.updatePosition(nodeId, position)
	}

	updateInstancePropValues(nodeId: string, propValues: Parameters<NodePropertyUsecase["updatePropValues"]>[1]) {
		this.nodeProperty.updatePropValues(nodeId, propValues)
	}

	syncToCanvas() {
		const state = this.store.getState()

		const codeComponentSources: Record<string, string> = {}
		for (const cc of state.codeComponents) {
			if (cc.compiledCode) {
				codeComponentSources[cc.id] = cc.compiledCode
			}
		}

		this.canvas.syncState({
			document: state.document,
			currentPageId: state.currentPageId,
			zoom: state.zoom,
			panX: state.panX,
			panY: state.panY,
			selection: state.selection,
			activeTool: state.activeTool,
			cursor: this.toolRegistry.getActiveTool()?.cursor ?? "default",
			codeComponentSources,
		})
	}

	// ── 읽기 ──

	findNode(id: string): SceneNode | null {
		return this.receiver.findNode(id)
	}

	findNodeLocation(id: string): NodeLocation | null {
		return this.receiver.findNodeLocation(id)
	}

	getCurrentPageId() {
		return this.receiver.getCurrentPageId()
	}

	getCurrentPage(): PageNode | null {
		return this.receiver.getCurrentPage()
	}

	getZoom() {
		return this.store.getState().zoom
	}

	getPan() {
		const { panX, panY } = this.store.getState()
		return { x: panX, y: panY }
	}

	getSelection() {
		return this.store.getState().selection
	}

	getActiveTool(): EditorTool {
		return this.store.getState().activeTool
	}

	getNodeRenderedRect(nodeId: string): NodeRect | null {
		return this.store.getState().nodeRectsCache[nodeId] ?? null
	}

	getHistorySnapshot() {
		return this.commandHistory.getSnapshot()
	}

	subscribeHistory(listener: () => void) {
		return this.commandHistory.subscribe(listener)
	}

	// ── 쓰기 ──

	setSelection(ids: string[]) {
		this.store.getState().setSelection(ids)
	}

	toggleSelection(id: string) {
		this.store.getState().toggleSelection(id)
	}

	setHoveredId(id: string | null) {
		this.store.getState().setHoveredId(id)
	}

	setActiveTool(tool: EditorTool) {
		this.store.getState().setActiveTool(tool)
	}

	setDragPreview(preview: { nodeId: string; dx: number; dy: number } | null) {
		this.store.getState().setDragPreview(preview)
	}

	setPan(x: number, y: number) {
		this.store.getState().setPan(x, y)
	}

	// ── Command 실행 ──

	executeCommand(cmd: Command) {
		this.commandHistory.execute(cmd)
	}

	beginTransaction() {
		this.commandHistory.beginTransaction()
	}

	commitTransaction() {
		this.commandHistory.commitTransaction()
	}

	undo() {
		this.commandHistory.undo()
	}

	redo() {
		this.commandHistory.redo()
	}
}
