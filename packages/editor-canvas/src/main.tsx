import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { CanvasFrameApp } from "./index"

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<CanvasFrameApp />
	</StrictMode>,
)
