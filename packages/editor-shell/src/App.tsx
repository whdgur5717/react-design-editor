import "./App.css"

import { type Connection,connectToChild } from "penpal"
import { useEffect, useRef, useState } from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { LayersPanel } from "./components/LayersPanel"
import { PropertiesPanel } from "./components/PropertiesPanel"
import { Toolbar } from "./components/Toolbar"
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts"
import type { CanvasMethods } from "./protocol/types"
import { useEditorStore } from "./store/editor"

export function App() {
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const [connection, setConnection] = useState<Connection<CanvasMethods> | null>(null)
	const document = useEditorStore((state) => state.document)
	const components = useEditorStore((state) => state.components)

	// 키보드 단축키 활성화
	useKeyboardShortcuts()

	useEffect(() => {
		if (!iframeRef.current) return

		const conn = connectToChild<CanvasMethods>({
			iframe: iframeRef.current,
			methods: {
				onNodeClicked(id: string, shiftKey: boolean) {
					if (shiftKey) {
						useEditorStore.getState().toggleSelection(id)
					} else {
						useEditorStore.getState().setSelection([id])
					}
				},
				onNodeHovered(id: string | null) {
					useEditorStore.getState().setHoveredId(id)
				},
				onNodeMoved(id: string, position: { x: number; y: number }) {
					useEditorStore.getState().moveNode(id, position)
				},
				onNodeResized(id: string, size: { width: number; height: number }) {
					useEditorStore.getState().resizeNode(id, size)
				},
			},
		})

		conn.promise.then((child) => {
			setConnection(conn)
			// 초기 상태 동기화
			child.syncState(document, components)
		})

		return () => {
			conn.destroy()
		}
	}, [])

	// 문서/컴포넌트 변경 시 캔버스에 동기화
	useEffect(() => {
		if (!connection) return
		connection.promise.then((child) => {
			child.syncState(document, components)
		})
	}, [document, components, connection])

	return (
		<div className="app">
			<Toolbar />
			<PanelGroup direction="horizontal" className="main-content">
				<Panel defaultSize={15} minSize={10} maxSize={25}>
					<LayersPanel />
				</Panel>
				<PanelResizeHandle className="resize-handle" />
				<Panel defaultSize={60} minSize={30}>
					<div className="canvas-container">
						<iframe ref={iframeRef} src="http://localhost:3001" title="Canvas" className="canvas-iframe" />
					</div>
				</Panel>
				<PanelResizeHandle className="resize-handle" />
				<Panel defaultSize={25} minSize={15} maxSize={35}>
					<PropertiesPanel />
				</Panel>
			</PanelGroup>
		</div>
	)
}
