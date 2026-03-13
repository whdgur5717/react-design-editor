import test from "node:test"
import assert from "node:assert/strict"
import type { ProviderAdapter } from "../src/providers/types"

const fakeProvider: ProviderAdapter = {
	name: "codex",
	capabilities: {
		supportsStreaming: false,
		supportsStructuredOutput: true,
	},
	async run() {
		return {
			finalMessage: "ok",
			executionFile: "/tmp/fake.json",
		}
	},
}

test("provider contract returns required fields", async () => {
	const result = await fakeProvider.run({
		prompt: "hello",
		mode: "prompt",
		config: {} as never,
	})

	assert.equal(typeof result.finalMessage, "string")
	assert.equal(typeof result.executionFile, "string")
})
