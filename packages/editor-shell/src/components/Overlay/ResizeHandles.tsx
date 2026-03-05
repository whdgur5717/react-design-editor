interface ResizeHandlesProps {
	rect: { x: number; y: number; width: number; height: number }
	zoom: number
}

const HANDLE_SIZE = 8

const handles = [
	{ name: "nw", cursor: "nwse-resize", xOffset: -HANDLE_SIZE / 2, yOffset: -HANDLE_SIZE / 2 },
	{ name: "n", cursor: "ns-resize", xOffset: 0.5, yOffset: -HANDLE_SIZE / 2, centered: true },
	{ name: "ne", cursor: "nesw-resize", xOffset: 1, yOffset: -HANDLE_SIZE / 2, rightAligned: true },
	{ name: "e", cursor: "ew-resize", xOffset: 1, yOffset: 0.5, rightAligned: true, centered: true },
	{ name: "se", cursor: "nwse-resize", xOffset: 1, yOffset: 1, rightAligned: true, bottomAligned: true },
	{ name: "s", cursor: "ns-resize", xOffset: 0.5, yOffset: 1, centered: true, bottomAligned: true },
	{ name: "sw", cursor: "nesw-resize", xOffset: -HANDLE_SIZE / 2, yOffset: 1, bottomAligned: true },
	{ name: "w", cursor: "ew-resize", xOffset: -HANDLE_SIZE / 2, yOffset: 0.5, centered: true },
]

function getHandlePosition(handle: (typeof handles)[number], rect: ResizeHandlesProps["rect"], size: number) {
	let x = rect.x
	let y = rect.y

	if (handle.rightAligned) x += rect.width - size / 2
	else if ((handle.centered && handle.name === "n") || handle.name === "s") x += rect.width / 2 - size / 2
	else x += (handle.xOffset / (HANDLE_SIZE / 2)) * (size / 2) // scale offset proportionally

	if (handle.bottomAligned) y += rect.height - size / 2
	else if ((handle.centered && handle.name === "e") || handle.name === "w") y += rect.height / 2 - size / 2
	else y += (handle.yOffset / (HANDLE_SIZE / 2)) * (size / 2) // scale offset proportionally

	return { x, y }
}

export function ResizeHandles({ rect, zoom }: ResizeHandlesProps) {
	const size = HANDLE_SIZE / zoom

	return (
		<>
			{handles.map((handle) => {
				const pos = getHandlePosition(handle, rect, size)
				return (
					<div
						key={handle.name}
						data-resize-handle={handle.name}
						style={{
							position: "absolute",
							left: 0,
							top: 0,
							width: size,
							height: size,
							transform: `translate(${pos.x}px, ${pos.y}px)`,
							backgroundColor: "#ffffff",
							border: `${2 / zoom}px solid #0d99ff`,
							borderRadius: "50%",
							cursor: handle.cursor,
							pointerEvents: "auto",
						}}
					/>
				)
			})}
		</>
	)
}
