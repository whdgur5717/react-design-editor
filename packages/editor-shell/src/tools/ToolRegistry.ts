import type { ClickPayload, DragPayload, EditorTool, KeyPayload } from "@design-editor/core"

import type { ToolService } from "./ToolService"
import type { Tool } from "./types"

/**
 * ToolRegistry - Strategy Pattern의 Context
 * 모든 이벤트를 받아서 현재 활성화된 Tool에 위임
 */
export class ToolRegistryImpl {
	private tools = new Map<EditorTool, Tool>()
	private service!: ToolService

	/**
	 * ToolService 초기화
	 */
	init(service: ToolService): void {
		this.service = service
	}

	/**
	 * Tool 등록
	 */
	register(toolType: EditorTool, tool: Tool): void {
		this.tools.set(toolType, tool)
	}

	/**
	 * Tool 가져오기
	 */
	get(toolType: EditorTool): Tool | undefined {
		return this.tools.get(toolType)
	}

	/**
	 * 현재 활성화된 Tool 가져오기
	 */
	getActiveTool(): Tool | undefined {
		const activeTool = this.service.getActiveTool()
		return this.tools.get(activeTool)
	}

	/**
	 * Tool 활성화 (이전 Tool 비활성화)
	 */
	setActiveTool(toolType: EditorTool): void {
		const currentTool = this.getActiveTool()
		const newTool = this.tools.get(toolType)

		currentTool?.onDeactivate()
		this.service.setActiveTool(toolType)
		newTool?.onActivate()
	}

	/**
	 * 모든 등록된 Tool 타입 가져오기
	 */
	getRegisteredTools(): EditorTool[] {
		return Array.from(this.tools.keys())
	}

	/**
	 * 클릭 이벤트 위임
	 */
	handleClick(nodeId: string | null, payload: ClickPayload): void {
		this.getActiveTool()?.onClick(nodeId, payload)
	}

	/**
	 * 드래그 종료 이벤트 위임
	 */
	handleDragEnd(nodeId: string | null, payload: DragPayload): void {
		this.getActiveTool()?.onDragEnd(nodeId, payload)
	}

	/**
	 * 키보드 이벤트 위임
	 */
	handleKeyDown(payload: KeyPayload): void {
		this.getActiveTool()?.onKeyDown(payload)
	}
}
