export function isTextInputElement(target: EventTarget | null): boolean {
	if (!target) return false
	const el = target as HTMLElement
	return el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA"
}
