import type { CanvasMethods, EditorTool, NodeRect, PageNode, SceneNode } from "@design-editor/core"
import type { AsyncMethodReturns } from "penpal"
import { type AnyActor, createActor } from "xstate"

import type { Command, NodeLocation } from "../commands"
import {
	CommandHistory,
	EditorReceiverImpl,
	registerHistoryShortcuts,
	registerNodeShortcuts,
	registerSelectionShortcuts,
	registerToolShortcuts,
	ShortcutRegistryImpl,
} from "../commands"
import { createPointerMachine } from "../interaction"
import { KeybindingRegistryImpl } from "../keybindings"
import { createEditorStore, type EditorStoreApi } from "../store/editor"
import { FrameTool } from "../tools/FrameTool"
import { SelectTool } from "../tools/SelectTool"
import { TextTool } from "../tools/TextTool"
import { ToolRegistryImpl } from "../tools/ToolRegistry"
import { ToolServiceImpl } from "../tools/ToolServiceImpl"

/**
 * EditorService — 모든 서브시스템을 소유하고 React Context로 제공
 *
 * store, commandHistory, receiver, toolRegistry, shortcutRegistry,
 * keybindingRegistry, pointerActor를 모두 소유한다.
 */
export class EditorService {
	readonly store: EditorStoreApi
	readonly commandHistory: CommandHistory
	readonly receiver: EditorReceiverImpl
	readonly toolRegistry: ToolRegistryImpl
	readonly shortcutRegistry: ShortcutRegistryImpl
	readonly keybindingRegistry: KeybindingRegistryImpl
	private pointerActor: AnyActor
	private canvasRef: AsyncMethodReturns<CanvasMethods> | null = null

	constructor() {
		// 모든 서브시스템을 직접 생성
		this.store = createEditorStore()
		this.receiver = new EditorReceiverImpl(this.store)
		this.commandHistory = new CommandHistory(50)
		this.toolRegistry = new ToolRegistryImpl()
		this.shortcutRegistry = new ShortcutRegistryImpl()
		this.keybindingRegistry = new KeybindingRegistryImpl(this.store)

		// Tool 초기화
		const toolService = new ToolServiceImpl(this)
		this.toolRegistry.init(toolService)
		this.toolRegistry.register("select", new SelectTool(toolService))
		this.toolRegistry.register("frame", new FrameTool(toolService))
		this.toolRegistry.register("text", new TextTool(toolService))

		// 단축키 등록
		registerHistoryShortcuts(this)
		registerNodeShortcuts(this)
		registerSelectionShortcuts(this)
		registerToolShortcuts(this)

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

	// ── Pointer events — actor를 내부 구현으로 은닉 ──

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

	// ── Canvas 연결 ──

	setCanvas(ref: AsyncMethodReturns<CanvasMethods> | null) {
		this.canvasRef = ref
	}

	getCanvas() {
		return this.canvasRef
	}

	// ── Canvas RPC ──

	async hitTest(x: number, y: number) {
		return (await this.canvasRef?.hitTest(x, y)) ?? null
	}

	async getNodeRect(nodeId: string) {
		return (await this.canvasRef?.getNodeRect(nodeId)) ?? null
	}

	syncToCanvas() {
		const state = this.store.getState()
		this.canvasRef?.syncState({
			document: state.document,
			currentPageId: state.currentPageId,
			components: state.components,
			zoom: state.zoom,
			selection: state.selection,
			activeTool: state.activeTool,
			cursor: this.toolRegistry.getActiveTool()?.cursor ?? "default",
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

	getSelection() {
		return this.store.getState().selection
	}

	getActiveTool(): EditorTool {
		return this.store.getState().activeTool
	}

	getNodeRenderedRect(nodeId: string): NodeRect | null {
		return this.store.getState().nodeRectsCache[nodeId] ?? null
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

	// ── Receiver 접근 (Command 생성용) ──

	getReceiver() {
		return this.receiver
	}
}
