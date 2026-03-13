import test from "node:test"
import assert from "node:assert/strict"
import { renderTemplate } from "../src/prompt/template"

test("renders allowlisted variables", () => {
	const output = renderTemplate("Hello {{actor}}", { actor: "alice" }, new Set(["actor"]))
	assert.equal(output, "Hello alice")
})

test("throws on unknown variable", () => {
	assert.throws(() => renderTemplate("Hello {{unknown}}", {}, new Set(["actor"])), /unknown variable/i)
})

test("supports escaped literal braces", () => {
	const output = renderTemplate("\\{{actor}}", { actor: "alice" }, new Set(["actor"]))
	assert.equal(output, "{{actor}}")
})
