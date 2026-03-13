import { chmod, cp, mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import parseArgsStringToArgv from "string-argv"
import * as core from "@actions/core"
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
	showFullOutput = false,
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
			const text = String(chunk)
			stdout += text
			if (showFullOutput) {
				process.stdout.write(text)
			}
		})
		child.stderr.on("data", (chunk) => {
			const text = String(chunk)
			stderr += text
			if (showFullOutput) {
				process.stderr.write(text)
			}
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
		let runtimeCodexHome = ""

		const installVersion = request.config.codexVersion || "0.114.0"
		if (installVersion === "latest") {
			throw new Error("codex-version must be pinned; latest is not allowed")
		}

		const installEnv = pickSafeEnv(process.env)
		core.info(`[codex] installing @openai/codex@${installVersion}`)
		await runCommand(
			"npm",
			["install", "-g", `@openai/codex@${installVersion}`],
			"",
			installEnv,
			timeoutMs,
			request.config.showFullOutput,
		)

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
		core.info(
			`[codex] run config sandbox=${request.config.sandbox} model=${request.config.model || "(default)"} effort=${request.config.effort || "(default)"} outputSchema=${request.config.outputSchema ? "yes" : "no"} extraArgs=${extraArgs.length}`,
		)

		const env = pickSafeEnv(process.env)
		const resolvedSkillDirs = request.config.skillDirectories.map((dir) => resolveAgainstWorkspace(dir))
		const existingSkillDirs = await filterExistingDirectories(resolvedSkillDirs)
		if (existingSkillDirs.length > 0) {
			if (!runtimeCodexHome) {
				runtimeCodexHome = await mkdtemp(path.join(os.tmpdir(), "agent-system-codex-home-"))
			}
			await exposeSkillDirectories(existingSkillDirs, runtimeCodexHome)
			env.CODEX_HOME = runtimeCodexHome
			core.info(`[codex] skills mounted count=${existingSkillDirs.length} dirs=${existingSkillDirs.join(",")}`)
			const skipped = resolvedSkillDirs.filter((dir) => !existingSkillDirs.includes(dir))
			if (skipped.length > 0) {
				core.info(`[codex] skipped missing skill dirs=${skipped.join(",")}`)
			}
		} else if (resolvedSkillDirs.length > 0) {
			core.info(`[codex] no existing skill directories found from input=${resolvedSkillDirs.join(",")}`)
		}

		if (request.config.codexAuthJsonB64) {
			core.info("[codex] auth mode=subscription (codex-auth-json-b64)")
			if (!runtimeCodexHome) {
				runtimeCodexHome = await mkdtemp(path.join(os.tmpdir(), "agent-system-codex-home-"))
			}
			await writeSubscriptionAuth(runtimeCodexHome, request.config.codexAuthJsonB64)
			env.CODEX_HOME = runtimeCodexHome
		} else if (request.config.openaiApiKey) {
			core.info("[codex] auth mode=api-key (openai-api-key)")
			env.OPENAI_API_KEY = request.config.openaiApiKey
		} else {
			throw new Error("Codex requires either openai-api-key or codex-auth-json-b64")
		}
		core.info(`[codex] command=codex ${args.join(" ")}`)

		try {
			const commandOutput = await runCommand("codex", args, request.prompt, env, timeoutMs, request.config.showFullOutput)

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
			core.info(
				`[codex] completed outputFile=${outputFile} finalMessageLength=${finalMessage.length} stdoutLength=${commandOutput.stdout.length} stderrLength=${commandOutput.stderr.length}`,
			)
			await writeFile(executionFile, JSON.stringify(execution, null, 2), "utf8")

			return {
				finalMessage,
				executionFile,
				structuredOutput,
			}
		} finally {
			if (runtimeCodexHome) {
				await rm(runtimeCodexHome, { recursive: true, force: true })
			}
		}
	},
}

async function writeSubscriptionAuth(codexHome: string, authJsonB64: string): Promise<void> {
	let authJson = ""
	try {
		authJson = Buffer.from(authJsonB64, "base64").toString("utf8")
		JSON.parse(authJson)
	} catch {
		throw new Error("codex-auth-json-b64 must be valid base64 JSON")
	}

	await mkdir(codexHome, { recursive: true })
	const authFile = path.join(codexHome, "auth.json")
	await writeFile(authFile, authJson, "utf8")
	await chmod(authFile, 0o600)
}

async function exposeSkillDirectories(skillDirectories: string[], codexHome: string): Promise<void> {
	const skillHome = path.join(codexHome, "skills")
	await mkdir(skillHome, { recursive: true })

	for (const [index, directory] of skillDirectories.entries()) {
		const base = path.basename(directory) || `skill-${index + 1}`
		const target = path.join(skillHome, `${index + 1}-${base}`)
		try {
			await symlink(directory, target, "dir")
		} catch {
			await cp(directory, target, { recursive: true })
		}
	}
}

function resolveAgainstWorkspace(inputPath: string): string {
	if (path.isAbsolute(inputPath)) {
		return inputPath
	}
	const base = process.env.GITHUB_WORKSPACE || process.cwd()
	return path.resolve(base, inputPath)
}

async function filterExistingDirectories(paths: string[]): Promise<string[]> {
	const result: string[] = []
	for (const p of paths) {
		try {
			const entry = await stat(p)
			if (entry.isDirectory()) {
				result.push(p)
			}
		} catch {}
	}
	return result
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
