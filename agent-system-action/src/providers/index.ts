import type { ResolvedProvider } from "../types"
import type { ProviderAdapter } from "./types"
import { codexAdapter } from "./codex"
import { claudeAdapter } from "./claude"

export function getProviderAdapter(provider: ResolvedProvider): ProviderAdapter {
	if (provider === "codex") {
		return codexAdapter
	}
	return claudeAdapter
}
