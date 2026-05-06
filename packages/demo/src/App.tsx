import { createEditor } from "@design-editor/sdk/createEditor"
import { EditorCanvas } from "@design-editor/sdk/EditorCanvas"
import { EditorProvider } from "@design-editor/sdk/EditorProvider"
import { EditorRoot } from "@design-editor/sdk/EditorRoot"
import { LayersPanel } from "@design-editor/sdk/LayersPanel"
import { PropertiesPanel } from "@design-editor/sdk/PropertiesPanel"
import { Toolbar } from "@design-editor/sdk/Toolbar"
import { useMemo } from "react"

import { LaunchCard, launchCardStyles } from "./components/LaunchCard"

export function App() {
	const editor = useMemo(() => {
		const nextEditor = createEditor({
			components: {
				LaunchCard: {
					component: LaunchCard,
					displayName: "Launch Card",
					styles: launchCardStyles,
				},
			},
		})

		nextEditor.store.getState().updateNode("root", {
			tag: "LaunchCard",
			x: 64,
			y: 56,
			props: {
				eyebrow: "Demo workspace",
				status: "On track",
				title: "Launch readiness board",
			},
			style: {
				width: 520,
				minHeight: 320,
				padding: 28,
			},
			children: [
				{
					id: "launch-card-copy",
					type: "text",
					x: 0,
					y: 0,
					content: {
						type: "doc",
						content: [
							{
								type: "paragraph",
								content: [
									{
										type: "text",
										text:
											"Approve final copy, token mapping, and embedded canvas QA before the preview opens to the product team.",
									},
								],
							},
						],
					},
					style: {
						color: "rgba(247, 241, 232, 0.78)",
						fontSize: 15,
						lineHeight: 1.55,
					},
				},
			],
		})

		return nextEditor
	}, [])

	return (
		<EditorProvider editor={editor}>
			<EditorRoot>
				<Toolbar />
				<LayersPanel />
				<EditorCanvas />
				<PropertiesPanel />
			</EditorRoot>
		</EditorProvider>
	)
}
