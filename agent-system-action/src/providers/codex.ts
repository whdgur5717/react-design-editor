import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import parseArgsStringToArgv from "string-argv"
import type { AgentRequest, AgentResult, ProviderAdapter } from "./types"

const DISALLOWED_EXTRA_ARGS = new Set(["--sandbox", "--cd", "--output-last-message", "--output-schema"])

function parseExtraArgs(raw: string): string[] {
	if (!raw.trim()) {
		return []
	}
	if (raw.trim().startsWith("[")) {
		const parsed = JSON.parse(raw)
		if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
			throw new Error("codex-args JSON form must be a string array")
		}
		return parsed
	}
	return parseArgsStringToArgv(raw)
}

function validateExtraArgs(args: string[]) {
	for (const arg of args) {
		if (DISALLOWED_EXTRA_ARGS.has(arg)) {
			throw new Error(`codex-args contains disallowed flag: ${arg}`)
		}
	}
}

function pickSafeEnv(base: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
	const safe: NodeJS.ProcessEnv = {}
	const allow = ["PATH", "HOME", "RUNNER_TEMP", "TMPDIR", "TMP", "TEMP"]
	for (const key of allow) {
		if (base[key]) {
			safe[key] = base[key]
		}
	}
	return safe
}

function runCommand(
	program: string,
	args: string[],
	input: string,
	env: NodeJS.ProcessEnv,
	timeoutMs: number,
): Promise<{ stdout: string; stderr: string }> {
	return new Promise((resolve, reject) => {
		const child = spawn(program, args, {
			env,
			stdio: ["pipe", "pipe", "pipe"],
		})

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

		child.stdin.write(input)
		child.stdin.end()

		child.on("error", reject)
		child.on("close", (code) => {
			clearTimeout(timer)
			if (code === 0) {
				resolve({ stdout, stderr })
			} else {
				reject(new Error(`${program} exited with code ${code}: ${stderr || stdout}`))
			}
		})
	})
}

export const codexAdapter: ProviderAdapter = {
	name: "codex",
	capabilities: {
		supportsStructuredOutput: true,
		supportsStreaming: false,
	},
	async run(request: AgentRequest): Promise<AgentResult> {
		const tempDir = await mkdtemp(path.join(os.tmpdir(), "agent-system-codex-"))
		const outputFile = path.join(tempDir, "last-message.md")
		const executionFile = path.join(tempDir, "execution.json")
		const timeoutMs = request.config.timeoutMinutes * 60 * 1000

		const installVersion = request.config.codexVersion || "0.114.0"
		if (installVersion === "latest") {
			throw new Error("codex-version must be pinned; latest is not allowed")
		}

		const installEnv = pickSafeEnv(process.env)
		await runCommand("npm", ["install", "-g", `@openai/codex@${installVersion}`], "", installEnv, timeoutMs)

		const args = [
			"exec",
			"--skip-git-repo-check",
			"--cd",
			process.env.GITHUB_WORKSPACE || process.cwd(),
			"--output-last-message",
			outputFile,
			"--sandbox",
			request.config.sandbox,
		]

		if (request.config.model) {
			args.push("--model", request.config.model)
		}

		if (request.config.effort) {
			args.push("--config", `model_reasoning_effort="${request.config.effort}"`)
		}

		if (request.config.outputSchema) {
			const schemaFile = path.join(tempDir, "schema.json")
			await writeFile(schemaFile, request.config.outputSchema, "utf8")
			args.push("--output-schema", schemaFile)
		}

		const extraArgs = parseExtraArgs(request.config.codexArgs)
		validateExtraArgs(extraArgs)
		args.push(...extraArgs)

		const env = pickSafeEnv(process.env)
		if (request.config.openaiApiKey) {
			env.OPENAI_API_KEY = request.config.openaiApiKey
		}

		const commandOutput = await runCommand("codex", args, request.prompt, env, timeoutMs)

		const finalMessage = await readFile(outputFile, "utf8")
		const structuredOutput = tryParseStructuredOutput(finalMessage, Boolean(request.config.outputSchema))

		const execution = {
			provider: "codex",
			mode: request.mode,
			command: ["codex", ...args],
			outputFile,
			stdoutLength: commandOutput.stdout.length,
			stderrLength: commandOutput.stderr.length,
		}
		await writeFile(executionFile, JSON.stringify(execution, null, 2), "utf8")

		return {
			finalMessage,
			executionFile,
			structuredOutput,
		}
	},
}

function tryParseStructuredOutput(finalMessage: string, required: boolean): string | undefined {
	try {
		const parsed = JSON.parse(finalMessage)
		return JSON.stringify(parsed)
	} catch {
		if (required) {
			throw new Error("output-schema was provided but final message is not valid JSON")
		}
		return undefined
	}
}
