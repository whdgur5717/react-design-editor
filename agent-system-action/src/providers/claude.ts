import { mkdtemp, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import * as core from "@actions/core"
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
		const timeoutMs = request.config.timeoutMinutes * 60 * 1000
		const executable = await ensureClaudeExecutable(timeoutMs)
		core.info(`[claude] executable=${executable}`)

		const tempDir = await mkdtemp(path.join(os.tmpdir(), "agent-system-claude-"))
		const executionFile = path.join(tempDir, "execution.json")
		const messages: SdkMessage[] = []
		let finalMessage = ""
		let sessionId = ""
		let structuredOutput: string | undefined

		const env: NodeJS.ProcessEnv = { ...process.env }
		delete env.GITHUB_TOKEN
		delete env.ACTIONS_ID_TOKEN_REQUEST_TOKEN
		delete env.ACTIONS_RUNTIME_TOKEN
		if (request.config.anthropicApiKey) {
			core.info("[claude] auth mode=anthropic-api-key")
			env.ANTHROPIC_API_KEY = request.config.anthropicApiKey
		}
		if (request.config.claudeCodeOauthToken) {
			core.info("[claude] auth mode=oauth-token")
			env.CLAUDE_CODE_OAUTH_TOKEN = request.config.claudeCodeOauthToken
		}

		const options: Record<string, unknown> = {
			env,
			maxTurns: 50,
			pathToClaudeCodeExecutable: executable,
		}
		core.info(`[claude] run config outputSchema=${request.config.outputSchema ? "yes" : "no"} timeoutMs=${timeoutMs}`)

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
		core.info(
			`[claude] completed finalMessageLength=${finalMessage.length} messagesCaptured=${messages.length} sessionId=${sessionId || "(none)"}`,
		)

		return {
			finalMessage,
			executionFile,
			structuredOutput,
			sessionId,
		}
	},
}

async function ensureClaudeExecutable(timeoutMs: number): Promise<string> {
	const claudePath = await which("claude", timeoutMs)
	if (claudePath) {
		return claudePath
	}

	await runCommand("bash", ["-lc", "curl -fsSL https://claude.ai/install.sh | bash"], timeoutMs)

	const installedPath = await which("claude", timeoutMs)
	if (!installedPath) {
		throw new Error("Failed to install Claude Code executable")
	}

	return installedPath
}

async function which(binary: string, timeoutMs: number): Promise<string> {
	try {
		const output = await runCommand("bash", ["-lc", `command -v ${binary}`], timeoutMs)
		return output.trim()
	} catch {
		return ""
	}
}

function runCommand(program: string, args: string[], timeoutMs: number): Promise<string> {
	return new Promise((resolve, reject) => {
		const child = spawn(program, args, { stdio: ["ignore", "pipe", "pipe"] })
		let stdout = ""
		let stderr = ""
		const timer = setTimeout(() => {
			child.kill("SIGKILL")
			reject(new Error(`${program} timed out after ${timeoutMs} ms`))
		}, timeoutMs)

		child.stdout.on("data", (chunk) => {
			stdout += String(chunk)
		})
		child.stderr.on("data", (chunk) => {
			stderr += String(chunk)
		})

		child.on("error", (error) => {
			clearTimeout(timer)
			reject(error)
		})

		child.on("close", (code) => {
			clearTimeout(timer)
			if (code === 0) {
				resolve(stdout)
				return
			}
			reject(new Error(`${program} exited with code ${code}: ${stderr || stdout}`))
		})
	})
}
