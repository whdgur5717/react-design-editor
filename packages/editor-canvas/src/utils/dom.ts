export function getTargetNodeId(el: HTMLElement | null) {
	while (el && el !== document.body) {
		if (el.dataset.nodeId) return el.dataset.nodeId
		el = el.parentElement
	}
	return null
}

export function isResizeHandle(el: HTMLElement) {
	return el.classList.contains("resize-handle") || el.closest(".resize-handle") !== null
}
