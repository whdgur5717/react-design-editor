import type { ReactNode } from "react"
import { createPortal } from "react-dom"

export interface PortalProps {
	container: Element | DocumentFragment | null
	children: ReactNode
}

export function Portal({ container, children }: PortalProps) {
	if (!container) return null
	return createPortal(children, container)
}
