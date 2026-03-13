import * as github from "@actions/github"
import type { Octokit } from "@octokit/rest"

const COMMENT_MARKER = "<!-- agent-system-action -->"

export type CommentTarget = {
	owner: string
	repo: string
	issueNumber: number
}

export function resolveCommentTarget(mode: "off" | "issue" | "pr"): CommentTarget | null {
	if (mode === "off") {
		return null
	}

	const issueNumber =
		github.context.payload.pull_request?.number || github.context.payload.issue?.number || github.context.issue.number

	if (!issueNumber) {
		return null
	}

	if (mode === "pr" && !github.context.payload.pull_request) {
		return null
	}

	return {
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		issueNumber,
	}
}

export function renderCommentBody(input: {
	status: "running" | "completed" | "failed"
	finalMessage?: string
	errorMessage?: string
	provider?: string
	mode?: string
	executionFile?: string
	durationMs?: number
}): string {
	const statusLine =
		input.status === "running"
			? "Agent is running..."
			: input.status === "failed"
				? `Agent failed.\n\n${input.errorMessage || "unknown error"}`
				: input.finalMessage || "(empty response)"

	return [
		COMMENT_MARKER,
		"## Agent System Action",
		statusLine,
		"",
		`- Provider: ${input.provider || "n/a"}`,
		`- Mode: ${input.mode || "n/a"}`,
		`- Duration: ${input.durationMs ?? "n/a"} ms`,
		`- Execution file: ${input.executionFile || "n/a"}`,
	].join("\n")
}

async function findStickyComment(octokit: Octokit, target: CommentTarget): Promise<number | null> {
	const me = await octokit.rest.users.getAuthenticated()
	const myLogin = me.data.login

	let page = 1
	while (true) {
		const response = await octokit.rest.issues.listComments({
			owner: target.owner,
			repo: target.repo,
			issue_number: target.issueNumber,
			per_page: 100,
			page,
		})

		const match = response.data.find((comment) =>
			Boolean(comment.body?.includes(COMMENT_MARKER) && comment.user && comment.user.login === myLogin),
		)
		if (match) {
			return match.id
		}

		if (response.data.length < 100) {
			return null
		}
		page += 1
	}
}

export async function publishOrUpdateComment(input: {
	octokit: Octokit
	target: CommentTarget
	body: string
	useStickyComment: boolean
	commentId?: number | null
}): Promise<number> {
	const { octokit, target, body, useStickyComment } = input
	let commentId = input.commentId || null

	if (!commentId && useStickyComment) {
		commentId = await findStickyComment(octokit, target)
	}

	if (commentId) {
		await octokit.rest.issues.updateComment({
			owner: target.owner,
			repo: target.repo,
			comment_id: commentId,
			body,
		})
		return commentId
	}

	const response = await octokit.rest.issues.createComment({
		owner: target.owner,
		repo: target.repo,
		issue_number: target.issueNumber,
		body,
	})
	return response.data.id
}
