import { createEditor, type CreateEditorOptions } from "open-editor-sdk/createEditor"
import { EditorCanvas } from "open-editor-sdk/EditorCanvas"
import { EditorProvider } from "open-editor-sdk/EditorProvider"
import { EditorRoot } from "open-editor-sdk/EditorRoot"
import { LayersPanel } from "open-editor-sdk/LayersPanel"
import { PropertiesPanel } from "open-editor-sdk/PropertiesPanel"
import { Toolbar } from "open-editor-sdk/Toolbar"
import { useMemo } from "react"

import { LaunchCard, launchCardStyles } from "./components/LaunchCard"

function createDemoDocument(): NonNullable<CreateEditorOptions["document"]> {
	return {
		id: "doc-root",
		children: [
			{
				id: "page-1",
				name: "Page 1",
				children: [
					{
						id: "root",
						type: "element",
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
					},
				],
			},
		],
		meta: {
			name: "Demo",
		},
	}
}

export function App() {
	const editor = useMemo(() => {
		return createEditor({
			document: createDemoDocument(),
			currentPageId: "page-1",
			components: {
				LaunchCard: {
					component: LaunchCard,
					displayName: "Launch Card",
					styles: launchCardStyles,
				},
			},
		})
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
