import "./NodeWrapper.css"

import type { SceneNode } from "@design-editor/core"
import { Resizable } from "re-resizable"
import type { ReactNode } from "react"

interface NodeWrapperProps {
	node: SceneNode
	isSelected: boolean
	onResizeStart: () => void
	onResizeEnd: (width: number, height: number) => void
	children: ReactNode
}

export function NodeWrapper({ node, isSelected, onResizeStart, onResizeEnd, children }: NodeWrapperProps) {
	const style = node.style ?? {}
	const width = style.width ?? "auto"
	const height = style.height ?? "auto"
	const isLocked = node.locked === true

	const wrapperStyle: React.CSSProperties = {
		position: style.position,
		left: style.left,
		top: style.top,
		right: style.right,
		bottom: style.bottom,
		width,
		height,
	}

	return (
		<div
			data-node-id={node.id}
			className={`node-wrapper ${isSelected ? "selected" : ""} ${isLocked ? "locked" : ""}`}
			style={wrapperStyle}
		>
			{isSelected && !isLocked ? (
				<Resizable
					key={`${width}-${height}`}
					defaultSize={{ width, height }}
					onResizeStart={() => onResizeStart()}
					onResizeStop={(_e, _direction, ref) => {
						onResizeEnd(ref.offsetWidth, ref.offsetHeight)
					}}
					enable={{
						top: true,
						right: true,
						bottom: true,
						left: true,
						topRight: true,
						bottomRight: true,
						bottomLeft: true,
						topLeft: true,
					}}
					handleClasses={{
						top: "resize-handle resize-handle-n",
						right: "resize-handle resize-handle-e",
						bottom: "resize-handle resize-handle-s",
						left: "resize-handle resize-handle-w",
						topRight: "resize-handle resize-handle-ne",
						bottomRight: "resize-handle resize-handle-se",
						bottomLeft: "resize-handle resize-handle-sw",
						topLeft: "resize-handle resize-handle-nw",
					}}
				>
					{children}
				</Resizable>
			) : (
				children
			)}
		</div>
	)
}
