import { useState } from "react"

import { useEditorStore } from "../../services/EditorContext"
import { LayerChildren } from "./LayerChildren"

export function LayersPanelContent() {
	const document = useEditorStore((state) => state.document)
	const currentPageId = useEditorStore((state) => state.currentPageId)
	const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

	const currentPage = document.children.find((p) => p.id === currentPageId)

	const toggleCollapse = (id: string) => {
		setCollapsedIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}

	if (!currentPage) {
		return <div className="layers-list">No page selected</div>
	}

	const hasChildren = currentPage.children.length > 0
	const isCollapsed = collapsedIds.has(currentPage.id)

	return (
		<div className="layers-list">
			<div className="layer-item">
				<div className="layer-row root-layer" style={{ paddingLeft: 8 }}>
					<button className="layer-collapse-btn" onClick={() => toggleCollapse(currentPage.id)} disabled={!hasChildren}>
						{hasChildren ? (isCollapsed ? "▶" : "▼") : "─"}
					</button>
					<span className="layer-name">{currentPage.name}</span>
				</div>
				{hasChildren && !isCollapsed && (
					<LayerChildren
						nodes={currentPage.children}
						depth={1}
						parentId={currentPage.id}
						collapsedIds={collapsedIds}
						onToggleCollapse={toggleCollapse}
					/>
				)}
			</div>
		</div>
	)
}
