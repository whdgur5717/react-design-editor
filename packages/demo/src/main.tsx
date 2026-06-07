import "@design-editor/sdk/styles.css"
import "./index.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./App"

const root = document.getElementById("root")

if (!root) {
	throw new Error("Unable to find root element")
}

createRoot(root).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
