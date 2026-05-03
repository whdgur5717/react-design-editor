import { CanvasFrameApp } from "@design-editor/canvas"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

const root = document.getElementById("root")

if (!root) {
	throw new Error("Canvas root element was not found")
}

createRoot(root).render(
	<StrictMode>
		<CanvasFrameApp />
	</StrictMode>,
)
