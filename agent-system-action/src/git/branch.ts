import { spawn } from "node:child_process"

export type BranchPushResult = {
	changed: boolean
	branchName?: string
	compareUrl?: string
}

export async function createBranchCommitAndPush(input: {
	repository: string
	runId?: string
	provider: string
}): Promise<BranchPushResult> {
	await runGit(["rev-parse", "--is-inside-work-tree"])

	const status = await runGit(["status", "--porcelain"])
	if (!status.stdout.trim()) {
		return { changed: false }
	}

	const safeProvider = input.provider.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase() || "agent"
	const stamp = new Date().toISOString().replace(/[:.]/g, "-")
	const branchName = `agent/${safeProvider}-${stamp}`

	await runGit(["checkout", "-b", branchName])
	await runGit(["config", "user.name", "agent-system-action"])
	await runGit(["config", "user.email", "agent-system-action@users.noreply.github.com"])
	await runGit(["add", "-A"])

	const shortRun = (input.runId || "manual").slice(0, 16)
	await runGit(["commit", "-m", `chore(agent): apply automated changes (run ${shortRun})`])
	await runGit(["push", "-u", "origin", branchName])

	const compareUrl = `https://github.com/${input.repository}/compare/${branchName}?expand=1`
	return { changed: true, branchName, compareUrl }
}

function runGit(args: string[]): Promise<{ stdout: string; stderr: string }> {
	return new Promise((resolve, reject) => {
		const child = spawn("git", args, { stdio: ["ignore", "pipe", "pipe"] })
		let stdout = ""
		let stderr = ""

		child.stdout.on("data", (chunk) => {
			stdout += String(chunk)
		})
		child.stderr.on("data", (chunk) => {
			stderr += String(chunk)
		})

		child.on("error", reject)
		child.on("close", (code) => {
			if (code === 0) {
				resolve({ stdout, stderr })
				return
			}
			reject(new Error(`git ${args.join(" ")} failed (code ${code}): ${stderr || stdout}`))
		})
	})
}
