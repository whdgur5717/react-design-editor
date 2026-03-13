import test from "node:test"
import assert from "node:assert/strict"
import * as github from "@actions/github"
import { detectMentionTrigger, extractUserRequest } from "../src/trigger"

test("detects trigger phrase", () => {
	;(github.context as unknown as { payload: { comment: { body: string } } }).payload = {
		comment: { body: "@agent please do this" },
	}

	assert.equal(detectMentionTrigger("@agent"), true)
})

test("extracts fenced request", () => {
	;(github.context as unknown as { payload: { comment: { body: string } } }).payload = {
		comment: { body: "@agent\n```\nrun tests\n```" },
	}

	assert.equal(extractUserRequest("@agent"), "run tests")
})
