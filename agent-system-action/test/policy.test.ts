import test from "node:test"
import assert from "node:assert/strict"
import * as github from "@actions/github"
import { decidePolicy } from "../src/policy"
import type { NormalizedConfig } from "../src/types"

const baseConfig: NormalizedConfig = {
	mode: "auto",
	provider: "codex",
	prompt: "hello",
	promptFile: "",
	promptTemplate: "",
	promptTemplateFile: "",
	appendSystemPrompt: "",
	customInstructions: "",
	triggerPhrase: "@agent",
	requireTrigger: true,
	behavior: "branch-commit-push",
	githubToken: "",
	githubCommentMode: "off",
	useStickyComment: true,
	trackProgress: true,
	displayReport: true,
	showFullOutput: false,
	allowUsers: "",
	allowBots: false,
	allowedNonWriteUsers: "",
	skillDirectories: [],
	openaiApiKey: "",
	codexAuthJsonB64: "",
	codexVersion: "latest",
	codexArgs: "",
	sandbox: "workspace-write",
	model: "",
	effort: "",
	anthropicApiKey: "",
	claudeCodeOauthToken: "",
	timeoutMinutes: 20,
	outputSchema: "",
}

test("forces safe behavior for untrusted fork", async () => {
	;(github.context as unknown as { payload: { pull_request: { head: { repo: { fork: boolean } } } } }).payload = {
		pull_request: { head: { repo: { fork: true } } },
	}

	const policy = await decidePolicy({ config: baseConfig })
	assert.equal(policy.allowedBehavior, "comment")
})

test("non-write allowlist must not grant write behavior", async () => {
	;(github.context as unknown as { payload: Record<string, unknown>; actor: string }).payload = {}
	;(github.context as unknown as { payload: Record<string, unknown>; actor: string }).actor = "trusted-user"

	const policy = await decidePolicy({
		config: {
			...baseConfig,
			allowedNonWriteUsers: "trusted-user",
		},
	})

	assert.equal(policy.trustTier, "trusted")
	assert.equal(policy.allowWrite, false)
})
