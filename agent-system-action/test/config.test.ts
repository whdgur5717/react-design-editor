import test from "node:test"
import assert from "node:assert/strict"
import { loadConfig } from "../src/config"

function setInput(name: string, value: string) {
	process.env[`INPUT_${name.toUpperCase().replace(/-/g, "_")}`] = value
}

function clearInputs() {
	for (const key of Object.keys(process.env)) {
		if (key.startsWith("INPUT_")) {
			delete process.env[key]
		}
	}
}

test("fails when both prompt and prompt-file are set", () => {
	clearInputs()
	setInput("prompt", "hello")
	setInput("prompt-file", "prompt.md")

	assert.throws(() => loadConfig(), /Only one of prompt or prompt-file/)
})

test("loads default values", () => {
	clearInputs()
	setInput("prompt", "hello")

	const config = loadConfig()
	assert.equal(config.mode, "auto")
	assert.equal(config.provider, "codex")
	assert.equal(config.behavior, "comment")
	assert.equal(config.timeoutMinutes, 20)
})
