import type { SceneNode } from "@design-editor/core"
import { serializeDocument, serializeNode } from "@design-editor/core"
import { useState } from "react"

export function CodeTab({ node }: { node: SceneNode }) {
	const [showFull, setShowFull] = useState(false)
	const [copied, setCopied] = useState(false)

	// InstanceNode는 코드 생성 불가
	if (node.type === "instance") {
		return (
			<div className="code-tab">
				<div className="empty-state">Instance nodes cannot be exported to code directly</div>
			</div>
		)
	}

	// TextNode는 코드 생성 미지원 (추후 구현)
	if (node.type === "text") {
		return (
			<div className="code-tab">
				<div className="empty-state">Text node code generation coming soon</div>
			</div>
		)
	}

	const code = showFull ? serializeDocument(node, "Component") : serializeNode(node)

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<div className="code-tab">
			<div className="code-header">
				<div className="code-toggle">
					<button className={`toggle-btn ${!showFull ? "active" : ""}`} onClick={() => setShowFull(false)}>
						JSX
					</button>
					<button className={`toggle-btn ${showFull ? "active" : ""}`} onClick={() => setShowFull(true)}>
						Component
					</button>
				</div>
				<button className="copy-btn" onClick={handleCopy}>
					{copied ? "Copied!" : "Copy"}
				</button>
			</div>
			<pre className="code-preview">
				<code>{code}</code>
			</pre>
		</div>
	)
}
