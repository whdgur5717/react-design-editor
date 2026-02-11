import "./NodeWrapper.css"

import type { SceneNode } from "@design-editor/core"
import { useDraggable, useDroppable } from "@dnd-kit/core"
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

	const baseLeft = typeof style.left === "number" ? style.left : 0
	const baseTop = typeof style.top === "number" ? style.top : 0

	const {
		attributes,
		listeners,
		setNodeRef: setDragRef,
		transform,
		isDragging,
	} = useDraggable({
		id: node.id,
		disabled: isLocked,
		data: {
			left: baseLeft,
			top: baseTop,
		},
	})

	const { setNodeRef: setDropRef, isOver } = useDroppable({
		id: node.id,
		disabled: isLocked || node.type === "instance",
	})

	const setRefs = (el: HTMLDivElement | null) => {
		setDragRef(el)
		setDropRef(el)
	}

	const tx = baseLeft + (transform?.x ?? 0)
	const ty = baseTop + (transform?.y ?? 0)

	const wrapperStyle: React.CSSProperties = {
		width,
		height,
		left: 0,
		top: 0,
		transform: `translate(${tx}px, ${ty}px)`,
		opacity: isDragging ? 0.5 : 1,
	}

	return (
		<div
			ref={setRefs}
			data-node-id={node.id}
			data-role="nodewrapper"
			className={`node-wrapper ${isSelected ? "selected" : ""} ${isLocked ? "locked" : ""} ${isDragging ? "dragging" : ""} ${isOver ? "drop-target" : ""}`}
			style={wrapperStyle}
			{...attributes}
			{...listeners}
		>
			{isOver && <div className="drop-indicator" />}

			{isSelected && !isLocked ? (
				<Resizable
					// TODO: size prop 사용 시 resize 시 깜빡임으로 인해 defaultSize + key 변경으로 강제 렌더링 적용. 더 좋은 방법 찾기
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
