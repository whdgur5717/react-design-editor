import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@design-editor/sdk/styles.css"

import { App } from "./App"
import "./index.css"

const root = document.getElementById("root")

if (!root) {
	throw new Error("Unable to find root element")
}

createRoot(root).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
