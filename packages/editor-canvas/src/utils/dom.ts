export function isTextInputElement(target: EventTarget | null): boolean {
	if (!target) return false
	const el = target as HTMLElement
	return el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA"
}

export function getTargetNodeId(el: HTMLElement | null): string | null {
	while (el && el !== document.body) {
		if (el.dataset.nodeId) return el.dataset.nodeId
		el = el.parentElement
	}
	return null
}

export function isResizeHandle(el: HTMLElement): boolean {
	return el.classList.contains("resize-handle") || el.closest(".resize-handle") !== null
}
