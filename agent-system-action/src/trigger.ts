import * as github from "@actions/github"

export function detectMentionTrigger(triggerPhrase: string): boolean {
	const payload = github.context.payload as { comment?: { body?: string } }
	const body = payload.comment?.body || ""
	if (!body) {
		return false
	}
	const escaped = triggerPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	const regex = new RegExp(`(?:^|\\s)${escaped}(?:\\s|$|[:.,!?])`, "i")
	return regex.test(body)
}

export function extractUserRequest(triggerPhrase: string): string {
	const payload = github.context.payload as { comment?: { body?: string } }
	const body = payload.comment?.body || ""
	if (!body) {
		return ""
	}

	const fenced = body.match(/```(?:[\w-]+)?\n([\s\S]*?)```/)
	if (fenced?.[1]) {
		return fenced[1].trim()
	}

	const normalized = body.replace(triggerPhrase, "").trim()
	return normalized
}
