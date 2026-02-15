interface SelectionOverlayProps {
	rects: Map<string, { x: number; y: number; width: number; height: number }>
}

export function SelectionOverlay({ rects }: SelectionOverlayProps) {
	return (
		<>
			{Array.from(rects.entries()).map(([nodeId, rect]) => (
				<div
					key={nodeId}
					className="selection-border"
					style={{
						position: "absolute",
						left: 0,
						top: 0,
						width: rect.width,
						height: rect.height,
						transform: `translate(${rect.x}px, ${rect.y}px)`,
						outline: "2px solid #0d99ff",
						outlineOffset: -1,
						pointerEvents: "none",
					}}
				/>
			))}
		</>
	)
}
