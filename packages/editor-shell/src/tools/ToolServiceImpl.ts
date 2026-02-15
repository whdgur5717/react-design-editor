import type { EditorTool, SceneNode } from "@design-editor/core"

import type { EditorService } from "../services/EditorService"
import type { ToolService } from "./ToolService"

/**
 * ToolServiceImpl - EditorService를 래핑하여 ToolService 인터페이스 제공
 */
export class ToolServiceImpl implements ToolService {
	constructor(private readonly editorService: EditorService) {}

	getSelection() {
		return this.editorService.getSelection()
	}

	setSelection(ids: string[]) {
		this.editorService.setSelection(ids)
	}

	toggleSelection(id: string) {
		this.editorService.toggleSelection(id)
	}

	executeCommand(command: Parameters<EditorService["executeCommand"]>[0]) {
		this.editorService.executeCommand(command)
	}

	beginTransaction() {
		this.editorService.beginTransaction()
	}

	commitTransaction() {
		this.editorService.commitTransaction()
	}

	findNode(id: string): SceneNode | null {
		return this.editorService.findNode(id)
	}

	findNodeLocation(id: string) {
		return this.editorService.findNodeLocation(id)
	}

	getCurrentPageId() {
		return this.editorService.getCurrentPageId()
	}

	getActiveTool(): EditorTool {
		return this.editorService.getActiveTool()
	}

	setActiveTool(tool: EditorTool) {
		this.editorService.setActiveTool(tool)
	}

	getReceiver() {
		return this.editorService.getReceiver()
	}
}
