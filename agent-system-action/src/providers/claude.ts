import { mkdtemp, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import type { AgentRequest, AgentResult, ProviderAdapter } from "./types"

type SdkMessage = {
	type: string
	subtype?: string
	session_id?: string
	structured_output?: unknown
	[key: string]: unknown
}

export const claudeAdapter: ProviderAdapter = {
	name: "claude",
	capabilities: {
		supportsStructuredOutput: true,
		supportsStreaming: true,
	},
	async run(request: AgentRequest): Promise<AgentResult> {
		const sdk = await import("@anthropic-ai/claude-agent-sdk")
		const query = sdk.query as (input: { prompt: string; options: Record<string, unknown> }) => AsyncIterable<SdkMessage>

		const tempDir = await mkdtemp(path.join(os.tmpdir(), "agent-system-claude-"))
		const executionFile = path.join(tempDir, "execution.json")
		const messages: SdkMessage[] = []
		let finalMessage = ""
		let sessionId = ""
		let structuredOutput: string | undefined

		const env: NodeJS.ProcessEnv = {}
		for (const key of ["PATH", "HOME", "RUNNER_TEMP", "TMPDIR", "TMP", "TEMP"]) {
			if (process.env[key]) {
				env[key] = process.env[key]
			}
		}
		if (request.config.anthropicApiKey) {
			env.ANTHROPIC_API_KEY = request.config.anthropicApiKey
		}
		if (request.config.claudeCodeOauthToken) {
			env.CLAUDE_CODE_OAUTH_TOKEN = request.config.claudeCodeOauthToken
		}

		const options: Record<string, unknown> = {
			env,
			maxTurns: 50,
		}

		for await (const message of query({ prompt: request.prompt, options })) {
			if (messages.length < 2000) {
				messages.push(message)
			}

			if (message.type === "assistant") {
				const text = String(message.text || "")
				if (text) {
					finalMessage = text
				}
			}

			if (message.type === "result") {
				if (message.subtype !== "success") {
					throw new Error(`Claude execution failed: ${message.subtype || "unknown"}`)
				}
				if (message.structured_output) {
					structuredOutput = JSON.stringify(message.structured_output)
				}
			}

			if (message.type === "system" && message.subtype === "init" && message.session_id) {
				sessionId = message.session_id
			}
		}

		if (request.config.outputSchema && !structuredOutput) {
			throw new Error("output-schema was provided but Claude did not return structured output")
		}

		await writeFile(executionFile, JSON.stringify(messages, null, 2), "utf8")

		return {
			finalMessage,
			executionFile,
			structuredOutput,
			sessionId,
		}
	},
}
