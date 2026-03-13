import * as core from "@actions/core"
import * as github from "@actions/github"
import { getProviderAdapter } from "./providers"
import { loadConfig, loadPromptSource, loadTemplateSource } from "./config"
import type { ResolvedMode, ResolvedProvider } from "./types"
import { detectMentionTrigger, extractUserRequest } from "./trigger"
import { decidePolicy } from "./policy"
import { renderTemplate } from "./prompt/template"
import { buildPrompt } from "./prompt/build"
import { redactSecrets } from "./logging/redact"
import { resolveCommentTarget, renderCommentBody, publishOrUpdateComment } from "./github/comments"
import { writeStepSummary } from "./report/summary"
import { Octokit } from "@octokit/rest"

function resolveMode(configMode: "auto" | "mention" | "prompt"): ResolvedMode {
	if (configMode === "mention") {
		return "mention"
	}
	if (configMode === "prompt") {
		return "prompt"
	}

	const mentionEvent =
		github.context.eventName === "issue_comment" || github.context.eventName === "pull_request_review_comment"

	return mentionEvent ? "mention" : "prompt"
}

function resolveProvider(provider: "auto" | "codex" | "claude"): ResolvedProvider {
	if (provider === "auto") {
		return "codex"
	}
	return provider
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(message)), timeoutMs)
		promise
			.then((value) => {
				clearTimeout(timer)
				resolve(value)
			})
			.catch((error) => {
				clearTimeout(timer)
				reject(error)
			})
	})
}

async function run() {
	const startedAt = Date.now()
	const config = loadConfig()
	const mode = resolveMode(config.mode)
	const provider = resolveProvider(config.provider)

	let octokit: Octokit | null = null
	let commentId: number | null = null
	const commentTarget = resolveCommentTarget(config.githubCommentMode)

	try {
		if (config.githubToken) {
			octokit = new Octokit({ auth: config.githubToken })
		}

		if (mode === "mention" && config.requireTrigger) {
			const containsTrigger = detectMentionTrigger(config.triggerPhrase)
			if (!containsTrigger) {
				core.info("Trigger phrase not found; exiting without provider call")
				core.setOutput("provider", provider)
				core.setOutput("mode", mode)
				core.setOutput("final_message", "")
				core.setOutput("execution_file", "")
				core.setOutput("structured_output", "")
				core.setOutput("duration_ms", String(Date.now() - startedAt))
				core.setOutput("comment_id", "")
				return
			}
		}

		const policy = await decidePolicy({ config })

		if (mode === "mention" && policy.trustTier === "untrusted") {
			core.info("Untrusted mention context detected; skipping provider execution")
			core.setOutput("provider", provider)
			core.setOutput("mode", mode)
			core.setOutput("final_message", "")
			core.setOutput("execution_file", "")
			core.setOutput("structured_output", "")
			core.setOutput("duration_ms", String(Date.now() - startedAt))
			core.setOutput("comment_id", "")
			return
		}
		const basePrompt = await loadPromptSource(config)
		const templateSource = await loadTemplateSource(config)
		const userRequest = mode === "mention" ? extractUserRequest(config.triggerPhrase) : ""

		const vars = {
			repository: process.env.GITHUB_REPOSITORY || "",
			actor: github.context.actor || "",
			event_name: github.context.eventName,
			ref: github.context.ref || "",
			user_request: userRequest,
			prompt: basePrompt,
		}

		const allowlist = new Set(["repository", "actor", "event_name", "ref", "user_request", "prompt"])
		const renderedTemplate = templateSource ? renderTemplate(templateSource, vars, allowlist) : ""

		const prompt = buildPrompt({
			basePrompt,
			renderedTemplate,
			userRequest,
			config,
		})

		if (commentTarget && octokit && config.trackProgress) {
			commentId = await publishOrUpdateComment({
				octokit,
				target: commentTarget,
				body: renderCommentBody({ status: "running", provider, mode }),
				useStickyComment: config.useStickyComment,
			})
		}

		const adapter = getProviderAdapter(provider)
		const timeoutMs = config.timeoutMinutes * 60 * 1000
		const result = await withTimeout(
			adapter.run({ prompt, config, mode }),
			timeoutMs,
			`Execution timed out after ${config.timeoutMinutes} minutes`,
		)
		const durationMs = Date.now() - startedAt

		core.setOutput("provider", provider)
		core.setOutput("mode", mode)
		core.setOutput("final_message", result.finalMessage)
		core.setOutput("execution_file", result.executionFile)
		core.setOutput("structured_output", result.structuredOutput || "")
		core.setOutput("duration_ms", String(durationMs))
		core.setOutput("comment_id", commentId ? String(commentId) : "")

		if (config.displayReport) {
			await writeStepSummary({
				finalMessage: result.finalMessage,
				provider,
				mode,
				durationMs,
				executionFile: result.executionFile,
			})
		}

		if (commentTarget && octokit) {
			commentId = await publishOrUpdateComment({
				octokit,
				target: commentTarget,
				commentId,
				useStickyComment: config.useStickyComment,
				body: renderCommentBody({
					status: "completed",
					finalMessage: result.finalMessage,
					provider,
					mode,
					durationMs,
					executionFile: result.executionFile,
				}),
			})
			core.setOutput("comment_id", String(commentId))
		}

		if (policy.allowedBehavior === "branch-commit-push" && policy.allowWrite) {
			core.info("branch-commit-push behavior selected; provider is expected to have made workspace changes")
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		if (error instanceof Error) {
			core.error(`stack: ${error.stack || "(no stack)"}`)
		}
		const redactedMessage = redactSecrets(message, [
			config.openaiApiKey,
			config.anthropicApiKey,
			config.claudeCodeOauthToken,
		])

		if (commentTarget && octokit && commentId) {
			await publishOrUpdateComment({
				octokit,
				target: commentTarget,
				commentId,
				useStickyComment: true,
				body: renderCommentBody({ status: "failed", errorMessage: redactedMessage }),
			}).catch(() => {})
		}

		core.setFailed(redactedMessage)
	}
}

void run()
