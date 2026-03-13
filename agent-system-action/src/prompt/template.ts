const TEMPLATE_REGEX = /(?<!\\)\{\{([a-zA-Z0-9_]+)\}\}/g

export function renderTemplate(template: string, vars: Record<string, string>, allowlist: Set<string>): string {
	const missing = new Set<string>()

	const rendered = template.replace(TEMPLATE_REGEX, (_match, key: string) => {
		if (!allowlist.has(key)) {
			missing.add(key)
			return ""
		}
		return vars[key] ?? ""
	})

	if (missing.size > 0) {
		throw new Error(`Template contains unknown variable(s): ${Array.from(missing).join(", ")}`)
	}

	return rendered.replace(/\\\{\{/g, "{{")
}
