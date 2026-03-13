#!/usr/bin/env node

import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

function parseArgs(argv) {
	const args = {
		provider: "codex",
		prompt: "",
		mode: "prompt",
		timeoutMinutes: "20",
		sandbox: "workspace-write",
		codexAuthJsonB64: "",
	}

	for (let i = 2; i < argv.length; i += 1) {
		const arg = argv[i]
		if (arg === "--provider") {
			args.provider = argv[i + 1] || args.provider
			i += 1
			continue
		}
		if (arg === "--prompt") {
			args.prompt = argv[i + 1] || ""
			i += 1
			continue
		}
		if (arg === "--mode") {
			args.mode = argv[i + 1] || args.mode
			i += 1
			continue
		}
		if (arg === "--timeout-minutes") {
			args.timeoutMinutes = argv[i + 1] || args.timeoutMinutes
			i += 1
			continue
		}
		if (arg === "--sandbox") {
			args.sandbox = argv[i + 1] || args.sandbox
			i += 1
			continue
		}
		if (arg === "--codex-auth-json-b64") {
			args.codexAuthJsonB64 = argv[i + 1] || ""
			i += 1
			continue
		}
	}

	if (!args.prompt.trim()) {
		throw new Error("Missing required --prompt")
	}

	if (args.provider !== "codex" && args.provider !== "claude") {
		throw new Error("--provider must be codex or claude")
	}

	return args
}

function run() {
	const args = parseArgs(process.argv)
	const currentFile = fileURLToPath(import.meta.url)
	const root = path.resolve(path.dirname(currentFile), "..")
	const distMain = path.join(root, "dist", "main.js")

	const env = {
		...process.env,
		GITHUB_ACTIONS: "true",
		GITHUB_EVENT_NAME: "workflow_dispatch",
		GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY || "local/local",
		GITHUB_REF: process.env.GITHUB_REF || "refs/heads/local",

		INPUT_MODE: args.mode,
		INPUT_PROVIDER: args.provider,
		INPUT_PROMPT: args.prompt,
		INPUT_TIMEOUT_MINUTES: args.timeoutMinutes,
		INPUT_SANDBOX: args.sandbox,
		INPUT_GITHUB_COMMENT_MODE: "off",
		INPUT_DISPLAY_REPORT: "true",
		INPUT_TRACK_PROGRESS: "false",
		INPUT_SHOW_FULL_OUTPUT: "false",
	}

	if (args.provider === "codex") {
		env.INPUT_OPENAI_API_KEY = env.INPUT_OPENAI_API_KEY || process.env.OPENAI_API_KEY || ""
		env.INPUT_CODEX_AUTH_JSON_B64 =
			args.codexAuthJsonB64 || env.INPUT_CODEX_AUTH_JSON_B64 || process.env.CODEX_AUTH_JSON_B64 || ""
		if (!env.INPUT_OPENAI_API_KEY && !env.INPUT_CODEX_AUTH_JSON_B64) {
			throw new Error(
				"Codex run requires OPENAI_API_KEY/INPUT_OPENAI_API_KEY or CODEX_AUTH_JSON_B64/INPUT_CODEX_AUTH_JSON_B64",
			)
		}
	}

	if (args.provider === "claude") {
		env.INPUT_ANTHROPIC_API_KEY = env.INPUT_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || ""
		if (!env.INPUT_ANTHROPIC_API_KEY) {
			throw new Error("Claude run requires ANTHROPIC_API_KEY or INPUT_ANTHROPIC_API_KEY")
		}
	}

	const child = spawn(process.execPath, [distMain], {
		cwd: root,
		env,
		stdio: "inherit",
	})

	child.on("exit", (code) => {
		process.exit(code ?? 1)
	})
}

run()
