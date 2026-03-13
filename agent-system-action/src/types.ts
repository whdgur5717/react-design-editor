export type Mode = "auto" | "mention" | "prompt"
export type ResolvedMode = "mention" | "prompt"
export type Provider = "auto" | "codex" | "claude"
export type ResolvedProvider = "codex" | "claude"
export type Behavior = "comment" | "patch-suggestion" | "branch-commit-push"

export type NormalizedConfig = {
	mode: Mode
	provider: Provider
	prompt: string
	promptFile: string
	promptTemplate: string
	promptTemplateFile: string
	appendSystemPrompt: string
	customInstructions: string
	triggerPhrase: string
	requireTrigger: boolean
	behavior: Behavior
	githubToken: string
	githubCommentMode: "off" | "issue" | "pr"
	useStickyComment: boolean
	trackProgress: boolean
	displayReport: boolean
	showFullOutput: boolean
	allowUsers: string
	allowBots: boolean
	allowedNonWriteUsers: string
	skillDirectories: string[]
	openaiApiKey: string
	codexAuthJsonB64: string
	codexVersion: string
	codexArgs: string
	sandbox: "read-only" | "workspace-write" | "danger-full-access"
	model: string
	effort: string
	anthropicApiKey: string
	claudeCodeOauthToken: string
	timeoutMinutes: number
	outputSchema: string
}

export type PolicyDecision = {
	trustTier: "untrusted" | "trusted" | "maintainer"
	allowedBehavior: Behavior
	allowComment: boolean
	allowWrite: boolean
}
