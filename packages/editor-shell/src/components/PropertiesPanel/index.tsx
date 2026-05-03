import { useState } from "react"

import { useEditorState } from "../../services/EditorContext"
import { CodeTab } from "./CodeTab"
import { DesignTab } from "./DesignTab"

type Tab = "design" | "prototype" | "code"

export function PropertiesPanel() {
	const [activeTab, setActiveTab] = useState<Tab>("design")
	const selectedNode = useEditorState((editor) => {
		const selection = editor.getSelection()
		return selection.length === 1 ? editor.findNode(selection[0]) : null
	})

	return (
		<div className="properties-panel">
			<div className="panel-tabs">
				<button
					type="button"
					className={`tab-button ${activeTab === "design" ? "active" : ""}`}
					onClick={() => setActiveTab("design")}
				>
					Design
				</button>
				<button
					type="button"
					className={`tab-button ${activeTab === "prototype" ? "active" : ""}`}
					onClick={() => setActiveTab("prototype")}
				>
					Prototype
				</button>
				<button
					type="button"
					className={`tab-button ${activeTab === "code" ? "active" : ""}`}
					onClick={() => setActiveTab("code")}
				>
					Code
				</button>
			</div>

			<div className="panel-content">
				{selectedNode ? (
					<>
						{activeTab === "design" && (
							<>
								<DesignTab node={selectedNode} />
							</>
						)}
						{activeTab === "prototype" && <div className="empty-state">Prototype features coming soon</div>}
						{activeTab === "code" && <CodeTab node={selectedNode} />}
					</>
				) : (
					<div className="empty-state" data-testid="properties-empty">
						Select a layer to see its properties
					</div>
				)}
			</div>
		</div>
	)
}
