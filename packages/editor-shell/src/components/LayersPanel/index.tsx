import "./LayersPanel.css"

import { useState } from "react"

import { ComponentsPanel } from "./ComponentsPanel"
import { LayersPanelContent } from "./LayersPanelContent"

type LeftPanelTab = "layers" | "components"

export function LayersPanel() {
	const [activeTab, setActiveTab] = useState<LeftPanelTab>("layers")

	return (
		<div className="layers-panel">
			<div className="panel-tabs" style={{ display: "flex", borderBottom: "1px solid #333" }}>
				<button
					className={`tab-button ${activeTab === "layers" ? "active" : ""}`}
					onClick={() => setActiveTab("layers")}
					style={{ flex: 1 }}
				>
					Layers
				</button>
				<button
					className={`tab-button ${activeTab === "components" ? "active" : ""}`}
					onClick={() => setActiveTab("components")}
					style={{ flex: 1 }}
				>
					Components
				</button>
			</div>
			{activeTab === "layers" ? <LayersPanelContent /> : <ComponentsPanel />}
		</div>
	)
}
