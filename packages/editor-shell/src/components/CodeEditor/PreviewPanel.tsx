import { Preview } from "./Preview"

export function PreviewPanel({
	compiledCode,
	previewVersion,
}: {
	compiledCode: string | null
	previewVersion: number
}) {
	return (
		<div
			style={{
				width: 320,
				borderLeft: "1px solid #e0e0e0",
				display: "flex",
				flexDirection: "column",
				background: "#f8f8f8",
			}}
		>
			<div
				style={{
					padding: "8px 12px",
					borderBottom: "1px solid #e0e0e0",
					fontSize: 11,
					color: "#999",
					textTransform: "uppercase",
					fontWeight: 600,
				}}
			>
				Preview
			</div>
			<div style={{ flex: 1, background: "#fff" }}>
				{compiledCode ? (
					<Preview compiledCode={compiledCode} version={previewVersion} />
				) : (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							height: "100%",
							color: "#999",
							fontSize: 12,
						}}
					>
						Save to see preview
					</div>
				)}
			</div>
		</div>
	)
}
