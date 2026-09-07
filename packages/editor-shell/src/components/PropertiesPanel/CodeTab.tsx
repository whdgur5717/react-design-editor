import type { ElementNode, NodeSnapshot } from "@open-editor-sdk/core"
import { serializeDocument, serializeNode } from "@open-editor-sdk/core"
import { useState } from "react"

export function CodeTab({ node }: { node: NodeSnapshot }) {
	const [showFull, setShowFull] = useState(false)
	const [copied, setCopied] = useState(false)

	// TextNode는 코드 생성 미지원 (추후 구현)
	if (node.type === "text") {
		return (
			<div className="code-tab">
				<div className="empty-state">Text node code generation coming soon</div>
			</div>
		)
	}

	const elementNode = node as ElementNode
	const code = showFull ? serializeDocument(elementNode, "Component") : serializeNode(elementNode)

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
