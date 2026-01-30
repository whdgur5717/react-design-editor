import type { EditorTool } from "@design-editor/core"

import { useEditorStore } from "../store/editor"
import type { Tool } from "./types"

class ToolRegistryImpl {
	private tools = new Map<EditorTool, Tool>()

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
		const activeTool = useEditorStore.getState().activeTool
		return this.tools.get(activeTool)
	}

	/**
	 * Tool 활성화 (이전 Tool 비활성화)
	 */
	setActiveTool(toolType: EditorTool): void {
		const currentTool = this.getActiveTool()
		const newTool = this.tools.get(toolType)

		if (currentTool) {
			currentTool.onDeactivate()
		}

		useEditorStore.getState().setActiveTool(toolType)

		if (newTool) {
			newTool.onActivate()
		}
	}

	/**
	 * 모든 등록된 Tool 타입 가져오기
	 */
	getRegisteredTools(): EditorTool[] {
		return Array.from(this.tools.keys())
	}
}

// 싱글톤 인스턴스
export const toolRegistry = new ToolRegistryImpl()
