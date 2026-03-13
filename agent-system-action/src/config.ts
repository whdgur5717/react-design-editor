import * as core from "@actions/core"
import { readFile } from "node:fs/promises"
import path from "node:path"
import type { Behavior, Mode, NormalizedConfig, Provider } from "./types"

function getOptionalInput(name: string): string {
	const value = core.getInput(name)
	return value ? value.trim() : ""
}

function getBooleanInput(name: string, defaultValue = false): boolean {
	const raw = core.getInput(name)
	if (!raw) {
		return defaultValue
	}
	return !["0", "false", "no", "off"].includes(raw.trim().toLowerCase())
}

function getMultilineInput(name: string): string[] {
	const raw = core.getInput(name)
	if (!raw) {
		return []
	}
	return raw
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
}

function getNumberInput(name: string, defaultValue: number): number {
	const raw = core.getInput(name)
	if (!raw) {
		return defaultValue
	}
	const parsed = Number(raw)
	if (!Number.isFinite(parsed) || parsed <= 0) {
		throw new Error(`Input "${name}" must be a positive number`)
	}
	return parsed
}

function parseMode(value: string): Mode {
	if (value === "auto" || value === "mention" || value === "prompt") {
		return value
	}
	throw new Error(`Invalid mode: ${value}`)
}

function parseProvider(value: string): Provider {
	if (value === "auto" || value === "codex" || value === "claude") {
		return value
	}
	throw new Error(`Invalid provider: ${value}`)
}

function parseBehavior(value: string): Behavior {
	if (value === "comment" || value === "patch-suggestion" || value === "branch-commit-push") {
		return value
	}
	throw new Error(`Invalid behavior: ${value}`)
}

function parseSandbox(value: string): "read-only" | "workspace-write" | "danger-full-access" {
	if (value === "read-only" || value === "workspace-write" || value === "danger-full-access") {
		return value
	}
	throw new Error(`Invalid sandbox: ${value}`)
}

function parseGithubCommentMode(value: string): "off" | "issue" | "pr" {
	if (value === "off" || value === "issue" || value === "pr") {
		return value
	}
	throw new Error(`Invalid github-comment-mode: ${value}`)
}

export async function loadPromptSource(config: NormalizedConfig): Promise<string> {
	if (config.prompt) {
		return config.prompt
	}

	if (config.promptFile) {
		const filePath = resolvePath(config.promptFile)
		return readFile(filePath, "utf8")
	}

	return ""
}

export async function loadTemplateSource(config: NormalizedConfig): Promise<string> {
	if (config.promptTemplate) {
		return config.promptTemplate
	}
	if (config.promptTemplateFile) {
		const filePath = resolvePath(config.promptTemplateFile)
		return readFile(filePath, "utf8")
	}
	return ""
}

function resolvePath(inputPath: string): string {
	if (path.isAbsolute(inputPath)) {
		return inputPath
	}
	const base = process.env.GITHUB_WORKSPACE || process.cwd()
	return path.resolve(base, inputPath)
}

export function loadConfig(): NormalizedConfig {
	const prompt = getOptionalInput("prompt")
	const promptFile = getOptionalInput("prompt_file")
	const promptTemplate = getOptionalInput("prompt_template")
	const promptTemplateFile = getOptionalInput("prompt_template_file")

	const promptSources = [prompt, promptFile].filter(Boolean)
	if (promptSources.length > 1) {
		throw new Error("Only one of prompt or prompt-file may be set")
	}

	const templateSources = [promptTemplate, promptTemplateFile].filter(Boolean)
	if (templateSources.length > 1) {
		throw new Error("Only one of prompt-template or prompt-template-file may be set")
	}

	if (promptSources.length === 0 && templateSources.length === 0) {
		throw new Error("At least one prompt source is required")
	}

	const anthropicApiKey = getOptionalInput("anthropic_api_key")
	const claudeCodeOauthToken = getOptionalInput("claude_code_oauth_token")
	if (anthropicApiKey && claudeCodeOauthToken) {
		throw new Error("Only one of anthropic-api-key or claude-code-oauth-token may be set")
	}

	const openaiApiKey = getOptionalInput("openai_api_key")
	const codexAuthJsonB64 = getOptionalInput("codex_auth_json_b64")
	if (openaiApiKey && codexAuthJsonB64) {
		throw new Error("Only one of openai-api-key or codex-auth-json-b64 may be set")
	}

	const skillDirectories = getMultilineInput("skill_directories")

	return {
		mode: parseMode(getOptionalInput("mode") || "auto"),
		provider: parseProvider(getOptionalInput("provider") || "codex"),
		prompt,
		promptFile,
		promptTemplate,
		promptTemplateFile,
		appendSystemPrompt: getOptionalInput("append_system_prompt"),
		customInstructions: getOptionalInput("custom_instructions"),
		triggerPhrase: getOptionalInput("trigger_phrase") || "@agent",
		requireTrigger: getBooleanInput("require_trigger", true),
		behavior: parseBehavior(getOptionalInput("behavior") || "comment"),
		githubToken: getOptionalInput("github_token") || process.env.GITHUB_TOKEN || "",
		githubCommentMode: parseGithubCommentMode(getOptionalInput("github_comment_mode") || "off"),
		useStickyComment: getBooleanInput("use_sticky_comment", true),
		trackProgress: getBooleanInput("track_progress", true),
		displayReport: getBooleanInput("display_report", true),
		showFullOutput: getBooleanInput("show_full_output", false),
		allowUsers: getOptionalInput("allow_users"),
		allowBots: getBooleanInput("allow_bots", false),
		allowedNonWriteUsers: getOptionalInput("allowed_non_write_users"),
		skillDirectories: skillDirectories.length > 0 ? skillDirectories : [".agents/skills"],
		openaiApiKey,
		codexAuthJsonB64,
		codexVersion: getOptionalInput("codex_version") || "0.114.0",
		codexArgs: getOptionalInput("codex_args"),
		sandbox: parseSandbox(getOptionalInput("sandbox") || "workspace-write"),
		model: getOptionalInput("model"),
		effort: getOptionalInput("effort"),
		anthropicApiKey,
		claudeCodeOauthToken,
		timeoutMinutes: getNumberInput("timeout_minutes", 20),
		outputSchema: getOptionalInput("output_schema"),
	}
}
