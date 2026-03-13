import * as github from "@actions/github"
import type { NormalizedConfig } from "../types"

type PromptInput = {
	basePrompt: string
	renderedTemplate: string
	userRequest: string
	config: NormalizedConfig
}

export function buildPrompt({ basePrompt, renderedTemplate, userRequest, config }: PromptInput): string {
	const context = github.context
	const untrustedBlock = [
		"--- BEGIN UNTRUSTED GITHUB CONTEXT ---",
		`Repository: ${context.repo.owner}/${context.repo.repo}`,
		`Event: ${context.eventName}`,
		`Actor: ${context.actor || "unknown"}`,
		`Ref: ${context.ref || ""}`,
		"--- END UNTRUSTED GITHUB CONTEXT ---",
	].join("\n")

	const parts = [
		config.appendSystemPrompt,
		renderedTemplate,
		untrustedBlock,
		config.customInstructions,
		basePrompt,
		userRequest,
	].filter((part) => part && part.trim().length > 0)

	return parts.join("\n\n").trim()
}
