import type { EditorTool, NodeRect, PageNode, SceneNode } from "@design-editor/core"
import { type AnyActor, createActor } from "xstate"

import type { Command, EditorReceiver, NodeLocation } from "../commands"
import {
	ActionRegistry,
	CommandHistory,
	DuplicateNodeCommand,
	EditorReceiverImpl,
	RemoveNodeCommand,
} from "../commands"
import { createPointerMachine } from "../interaction"
import { KeybindingRegistry } from "../keybindings"
import { createEditorStore, type EditorStoreApi } from "../store/editor"
import { FrameTool } from "../tools/FrameTool"
import { SelectTool } from "../tools/SelectTool"
import { TextTool } from "../tools/TextTool"
import { ToolRegistry } from "../tools/ToolRegistry"
import { ToolServiceImpl } from "../tools/ToolServiceImpl"
import { CanvasBridge } from "./CanvasBridge"

/**
 * Editor — 모든 서브시스템을 소유하고 React Context로 제공
 *
 * store, commandHistory, receiver, toolRegistry, actionRegistry,
 * keybindingRegistry, canvas, pointerActor를 모두 소유한다.
 */
export class Editor {
	readonly store: EditorStoreApi
	readonly commandHistory: CommandHistory
	readonly receiver: EditorReceiverImpl
	readonly toolRegistry: ToolRegistry
	readonly actionRegistry: ActionRegistry
	readonly keybindingRegistry: KeybindingRegistry
	readonly canvas: CanvasBridge
	private pointerActor: AnyActor

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

		// 액션 등록
		this.actionRegistry.register("history:undo", () => this.commandHistory.undo())
		this.actionRegistry.register("history:redo", () => this.commandHistory.redo())

		this.actionRegistry.register("selection:clear", () => this.receiver.setSelection([]))
		this.actionRegistry.register("selection:all", () => {
			const page = this.receiver.getCurrentPage()
			if (!page) return
			const allIds = collectAllNodeIds(page.children)
			this.receiver.setSelection(allIds)
		})

		this.actionRegistry.register("node:delete", () => {
			const selection = this.receiver.getSelection()
			if (selection.length === 0) return

			const topLevelIds = filterToTopLevel(selection, this.receiver)

			if (topLevelIds.length > 1) this.commandHistory.beginTransaction()
			for (const id of topLevelIds) {
				this.commandHistory.execute(new RemoveNodeCommand(this.receiver, id))
			}
			if (topLevelIds.length > 1) this.commandHistory.commitTransaction()

			this.receiver.setSelection([])
		})

		this.actionRegistry.register("node:duplicate", () => {
			const selection = this.receiver.getSelection()
			if (selection.length === 0) return

			if (selection.length > 1) this.commandHistory.beginTransaction()
			for (const id of selection) {
				this.commandHistory.execute(new DuplicateNodeCommand(this.receiver, id))
			}
			if (selection.length > 1) this.commandHistory.commitTransaction()
		})

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

	// ── Receiver 접근 (Command 생성용) ──

	getReceiver() {
		return this.receiver
	}
}

// ── 유틸리티 함수 ──

function collectAllNodeIds(nodes: SceneNode[]) {
	const ids: string[] = []
	for (const node of nodes) {
		ids.push(node.id)
		if ("children" in node && Array.isArray(node.children)) {
			ids.push(...collectAllNodeIds(node.children))
		}
	}
	return ids
}

function filterToTopLevel(selection: string[], recv: EditorReceiver) {
	return selection.filter((id) => {
		let location = recv.findNodeLocation(id)
		while (location) {
			if (selection.includes(location.parentId)) return false
			location = recv.findNodeLocation(location.parentId)
		}
		return true
	})
}
