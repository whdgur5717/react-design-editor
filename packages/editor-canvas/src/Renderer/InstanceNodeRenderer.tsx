import type { InstanceNode } from "@design-editor/core"
import React from "react"

import type { RenderContext } from "./renderNode"

class CodeComponentErrorBoundary extends React.Component<
	{ children: React.ReactNode; nodeId: string },
	{ error: string | null }
> {
	override state: { error: string | null } = { error: null }

	static getDerivedStateFromError(error: Error) {
		return { error: error.message }
	}

	override render() {
		if (this.state.error) {
			return (
				<div data-node-id={this.props.nodeId} style={{ color: "red", padding: 8, fontSize: 12 }}>
					Error: {this.state.error}
				</div>
			)
		}
		return this.props.children
	}
}

export function renderInstanceContent(instance: InstanceNode, ctx: RenderContext): React.ReactNode {
	const CodeComponent = ctx.codeComponents[instance.componentId]
	if (!CodeComponent) return <span style={{ color: "red" }}>Missing Component</span>
	return (
		<CodeComponentErrorBoundary nodeId={instance.id}>
			<CodeComponent {...(instance.propValues ?? {})} />
		</CodeComponentErrorBoundary>
	)
}

export function renderInstanceNode(instance: InstanceNode, ctx: RenderContext): React.ReactNode {
	return (
		<div key={instance.id} data-node-id={instance.id} style={instance.style}>
			{renderInstanceContent(instance, ctx)}
		</div>
	)
}
