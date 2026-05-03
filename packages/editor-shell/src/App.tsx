import { useState } from "react"

import { CanvasView } from "./components/CanvasView"
import { Editor } from "./services/Editor"
import { EditorProvider } from "./services/EditorContext"

export function App() {
	const [editor] = useState(() => new Editor())

	return (
		<EditorProvider editor={editor}>
			<CanvasView />
		</EditorProvider>
	)
}
