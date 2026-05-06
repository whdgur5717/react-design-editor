import type * as React from "react"
import { createPortal } from "react-dom"

export interface PortalProps {
	container: Element | DocumentFragment | null
	children: React.ReactNode
}

export function Portal({ container, children }: PortalProps) {
	if (!container) return null
	return createPortal(children, container)
}
