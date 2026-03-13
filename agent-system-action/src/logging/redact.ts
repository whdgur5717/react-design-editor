export function redactSecrets(input: string, secrets: string[]): string {
	let output = input
	for (const secret of secrets) {
		if (!secret) {
			continue
		}
		output = output.split(secret).join("[REDACTED]")
	}
	return output
}
