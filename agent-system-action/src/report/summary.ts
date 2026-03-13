import * as core from "@actions/core"

export async function writeStepSummary(input: {
	finalMessage: string
	provider: string
	mode: string
	durationMs: number
	executionFile: string
}) {
	if (!process.env.GITHUB_STEP_SUMMARY) {
		return
	}

	await core.summary
		.addHeading("Agent System Action")
		.addCodeBlock(input.finalMessage || "(empty)", "md")
		.addList([
			`Provider: ${input.provider}`,
			`Mode: ${input.mode}`,
			`Duration: ${input.durationMs} ms`,
			`Execution file: ${input.executionFile}`,
		])
		.write()
}
