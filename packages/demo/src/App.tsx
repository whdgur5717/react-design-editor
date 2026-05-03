import { EditorCanvas } from "@design-editor/sdk/EditorCanvas"
import { EditorProvider } from "@design-editor/sdk/EditorProvider"
import { EditorRoot } from "@design-editor/sdk/EditorRoot"
import { LayersPanel } from "@design-editor/sdk/LayersPanel"
import { PropertiesPanel } from "@design-editor/sdk/PropertiesPanel"
import { Toolbar } from "@design-editor/sdk/Toolbar"
import { createEditor } from "@design-editor/sdk/createEditor"
import { useMemo } from "react"

export function App() {
	const editor = useMemo(() => createEditor(), [])

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
