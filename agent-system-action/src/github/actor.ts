import { Octokit } from "@octokit/rest"

export async function hasWriteAccess(token: string, actor: string, repository: string): Promise<boolean> {
	const [owner, repo] = repository.split("/")
	if (!owner || !repo) {
		return false
	}

	const octokit = new Octokit({ auth: token })
	try {
		const response = await octokit.repos.getCollaboratorPermissionLevel({
			owner,
			repo,
			username: actor,
		})
		const permission = response.data.permission || "none"
		return permission === "admin" || permission === "write" || permission === "maintain"
	} catch {
		return false
	}
}

export function matchesAllowSpec(actor: string, spec: string): boolean {
	if (!spec) {
		return false
	}
	const normalizedActor = actor.toLowerCase()
	return spec
		.split(",")
		.map((item) => item.trim().toLowerCase())
		.filter(Boolean)
		.some((entry) => {
			if (entry === "*") {
				return true
			}
			if (entry === "*[bot]") {
				return normalizedActor.endsWith("[bot]")
			}
			return entry === normalizedActor
		})
}
