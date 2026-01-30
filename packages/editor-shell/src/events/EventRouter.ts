import { commandRegistry } from "../commands"
import { keybindingRegistry } from "../keybindings"
import { toolRegistry } from "../tools"
import type { DragEndEvent } from "../tools/types"
import { eventBus } from "./EventBus"
import { type CanvasKeyEvent, type CanvasPointerEvent, EventTypes } from "./types"

class EventRouterImpl {
	private unsubscribers: Array<() => void> = []

	/**
	 * EventRouter 초기화 - 이벤트 구독 시작
	 */
	init(): void {
		// 키보드 이벤트 → Keybinding 매칭 → Command 실행
		this.unsubscribers.push(
			eventBus.subscribe(EventTypes.CANVAS_KEY_DOWN, (e) => this.handleKeyDown(e as CanvasKeyEvent)),
		)
		this.unsubscribers.push(eventBus.subscribe(EventTypes.SHELL_KEY_DOWN, (e) => this.handleKeyDown(e as CanvasKeyEvent)))

		// 포인터 이벤트 → 현재 Tool에 위임
		this.unsubscribers.push(
			eventBus.subscribe(EventTypes.CANVAS_MOUSE_DOWN, (e) => {
				const tool = toolRegistry.getActiveTool()
				tool?.onPointerDown(e as CanvasPointerEvent)
			}),
		)
		this.unsubscribers.push(
			eventBus.subscribe(EventTypes.CANVAS_MOUSE_MOVE, (e) => {
				const tool = toolRegistry.getActiveTool()
				tool?.onPointerMove(e as CanvasPointerEvent)
			}),
		)
		this.unsubscribers.push(
			eventBus.subscribe(EventTypes.CANVAS_MOUSE_UP, (e) => {
				const tool = toolRegistry.getActiveTool()
				tool?.onPointerUp(e as CanvasPointerEvent)
			}),
		)

		// 드래그 종료 이벤트 → Tool에 위임
		this.unsubscribers.push(
			eventBus.subscribe(EventTypes.CANVAS_DRAG_END, (e) => {
				const tool = toolRegistry.getActiveTool()
				tool?.onDragEnd(e as DragEndEvent)
			}),
		)
	}

	/**
	 * 정리
	 */
	destroy(): void {
		this.unsubscribers.forEach((unsub) => unsub())
		this.unsubscribers = []
	}

	/**
	 * 키보드 이벤트 처리
	 */
	private handleKeyDown(e: CanvasKeyEvent): void {
		// 1. Keybinding 매칭 시도
		const commandId = keybindingRegistry.match(e)
		if (commandId) {
			commandRegistry.execute(commandId)
			return
		}

		// 2. 매칭 안되면 현재 Tool에 위임
		const tool = toolRegistry.getActiveTool()
		tool?.onKeyDown(e)
	}
}

// 싱글톤 인스턴스
export const eventRouter = new EventRouterImpl()
