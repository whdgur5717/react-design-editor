interface HoverHighlightProps {
	rect: { x: number; y: number; width: number; height: number } | null
	zoom: number
}

export function HoverHighlight({ rect, zoom }: HoverHighlightProps) {
	if (!rect) return null

	return (
		<div
			className="hover-highlight"
			style={{
				position: "absolute",
				left: 0,
				top: 0,
				width: rect.width,
				height: rect.height,
				transform: `translate(${rect.x}px, ${rect.y}px)`,
				outline: `${1 / zoom}px solid #0d99ff66`,
				pointerEvents: "none",
			}}
		/>
	)
}
