import { commandHistory, receiver } from "../commands"
import { useEditorStore } from "../store/editor"
import { FrameTool } from "./FrameTool"
import { SelectTool } from "./SelectTool"
import { TextTool } from "./TextTool"
import { toolRegistry } from "./ToolRegistry"
import { ToolServiceImpl } from "./ToolServiceImpl"

// 모듈 레벨에서 Tool 시스템 초기화
const toolService = new ToolServiceImpl(useEditorStore, commandHistory, receiver)
toolRegistry.init(toolService)
toolRegistry.register("select", new SelectTool(toolService))
toolRegistry.register("frame", new FrameTool(toolService))
toolRegistry.register("text", new TextTool(toolService))

export { createFrameNode, createTextNode } from "./nodeFactory"
export { toolRegistry }
export type { ToolService } from "./ToolService"
export { BaseTool, type Tool } from "./types"
