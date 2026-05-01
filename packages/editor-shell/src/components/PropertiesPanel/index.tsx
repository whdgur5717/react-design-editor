import "./PropertiesPanel.css"

import { useState } from "react"

import { useEditor, useEditorStore } from "../../services/EditorContext"
import { CodeComponentPropsTab } from "./CodeComponentPropsTab"
import { CodeTab } from "./CodeTab"
import { DesignTab } from "./DesignTab"

type Tab = "design" | "prototype" | "code"

export function PropertiesPanel() {
	const [activeTab, setActiveTab] = useState<Tab>("design")
	const editor = useEditor()
	const selectedNode = useEditorStore((state) => {
		if (state.selection.length !== 1) return null
		return editor.findNode(state.selection[0])
	})

	const codeComponent = useEditorStore((state) => {
		if (!selectedNode || selectedNode.type !== "instance") return null
		return state.codeComponents.find((c) => c.id === selectedNode.componentId) ?? null
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
								{codeComponent && selectedNode.type === "instance" && (
									<CodeComponentPropsTab node={selectedNode} codeComponent={codeComponent} />
								)}
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
