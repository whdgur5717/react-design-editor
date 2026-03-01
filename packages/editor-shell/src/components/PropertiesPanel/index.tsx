import "./PropertiesPanel.css"

import { useState } from "react"

import { useEditorStore } from "../../services/EditorContext"
import { findNode } from "../../store/editor"
import { CodeComponentPropsTab } from "./CodeComponentPropsTab"
import { CodeTab } from "./CodeTab"
import { DesignTab } from "./DesignTab"

type Tab = "design" | "prototype" | "code"

export function PropertiesPanel() {
	const [activeTab, setActiveTab] = useState<Tab>("design")
	const selectedNode = useEditorStore((state) => {
		if (state.selection.length !== 1) return null
		const page = state.document.children.find((p) => p.id === state.currentPageId)
		return page ? findNode(page, state.selection[0]) : null
	})

	const codeComponent = useEditorStore((state) => {
		if (!selectedNode || selectedNode.type !== "instance") return null
		return state.codeComponents.find((c) => c.id === selectedNode.componentId) ?? null
	})

	return (
		<div className="properties-panel">
			<div className="panel-tabs">
				<button className={`tab-button ${activeTab === "design" ? "active" : ""}`} onClick={() => setActiveTab("design")}>
					Design
				</button>
				<button
					className={`tab-button ${activeTab === "prototype" ? "active" : ""}`}
					onClick={() => setActiveTab("prototype")}
				>
					Prototype
				</button>
				<button className={`tab-button ${activeTab === "code" ? "active" : ""}`} onClick={() => setActiveTab("code")}>
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
