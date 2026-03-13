import type { NormalizedConfig, ResolvedMode } from "../types"

export type AgentRequest = {
	prompt: string
	config: NormalizedConfig
	mode: ResolvedMode
}

export type AgentResult = {
	finalMessage: string
	executionFile: string
	structuredOutput?: string
	usageJson?: string
	sessionId?: string
}

export type ProviderCapabilities = {
	supportsStructuredOutput: boolean
	supportsStreaming: boolean
}

export interface ProviderAdapter {
	readonly name: "codex" | "claude"
	readonly capabilities: ProviderCapabilities
	run(request: AgentRequest): Promise<AgentResult>
}
