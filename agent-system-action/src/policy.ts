import * as github from "@actions/github"
import type { NormalizedConfig, PolicyDecision } from "./types"
import { hasWriteAccess, matchesAllowSpec } from "./github/actor"

type PolicyInput = {
	config: NormalizedConfig
}

export async function decidePolicy({ config }: PolicyInput): Promise<PolicyDecision> {
	const actor = github.context.actor || ""
	const repository = process.env.GITHUB_REPOSITORY || ""
	const payload = github.context.payload as {
		pull_request?: { head?: { repo?: { fork?: boolean } } }
		issue?: { pull_request?: unknown }
	}
	const isIssueCommentOnPr = Boolean(payload.issue?.pull_request)
	const isFork = Boolean(payload.pull_request?.head?.repo?.fork) || isIssueCommentOnPr
	const isBot = actor.endsWith("[bot]")
	const nonWriteAllowlisted = matchesAllowSpec(actor, config.allowedNonWriteUsers)

	let trustTier: PolicyDecision["trustTier"] = "untrusted"
	const writeAccess =
		Boolean(config.githubToken) && actor && repository
			? await hasWriteAccess(config.githubToken, actor, repository)
			: false

	if (writeAccess) {
		trustTier = "maintainer"
	} else if (matchesAllowSpec(actor, config.allowUsers) || nonWriteAllowlisted) {
		trustTier = "trusted"
	} else if (isBot && config.allowBots) {
		trustTier = "trusted"
	}

	let allowedBehavior = config.behavior
	if (isFork || trustTier === "untrusted") {
		if (config.behavior === "branch-commit-push") {
			allowedBehavior = "comment"
		}
	}

	const allowWrite =
		allowedBehavior === "branch-commit-push" && trustTier === "maintainer" && !isFork && !nonWriteAllowlisted

	return {
		trustTier,
		allowedBehavior,
		allowComment: config.githubCommentMode !== "off",
		allowWrite,
	}
}
