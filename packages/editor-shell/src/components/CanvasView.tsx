import { useEffect } from "react"

import { useView } from "../hooks/useView"
import { useEditor } from "../services/EditorContext"
import { ComponentCodeEditor } from "./CodeEditor/CodeEditorView"
import { LayersPanel } from "./LayersPanel"
import { ToolManagerOverlay } from "./Overlay"
import { PropertiesPanel } from "./PropertiesPanel"
import { Toolbar } from "./Toolbar"

export function CanvasView() {
	const editor = useEditor()
	const [{ edit: editingComponentId }] = useView()

	useEffect(() => {
		const eventTarget = document.getElementById("canvas-event-target")
		if (!eventTarget) return

		const onPointerDown = (e: PointerEvent) => {
			e.preventDefault()
			editor.sendPointerDown({
				clientX: e.clientX,
				clientY: e.clientY,
				pointerId: e.pointerId,
				shiftKey: e.shiftKey,
				metaKey: e.metaKey,
				target: e.target as HTMLElement,
			})
		}

		const onPointerMove = (e: PointerEvent) => {
			editor.sendPointerMove({
				clientX: e.clientX,
				clientY: e.clientY,
			})
		}

		const onPointerUp = (e: PointerEvent) => {
			editor.sendPointerUp({
				clientX: e.clientX,
				clientY: e.clientY,
				shiftKey: e.shiftKey,
				metaKey: e.metaKey,
			})
		}

		const onWheel = (e: WheelEvent) => {
			e.preventDefault()
			editor.handleWheel({
				deltaX: e.deltaX,
				deltaY: e.deltaY,
				clientX: e.clientX,
				clientY: e.clientY,
				ctrlKey: e.ctrlKey,
				metaKey: e.metaKey,
			})
		}

		const onKeyDown = (e: KeyboardEvent) => {
			editor.sendKeyDown({
				key: e.key,
				code: e.code,
				shiftKey: e.shiftKey,
				ctrlKey: e.ctrlKey,
				metaKey: e.metaKey,
				altKey: e.altKey,
				target: e.target as HTMLElement,
			})
		}

		eventTarget.addEventListener("pointerdown", onPointerDown)
		eventTarget.addEventListener("pointermove", onPointerMove)
		eventTarget.addEventListener("pointerup", onPointerUp)
		eventTarget.addEventListener("wheel", onWheel, { passive: false })
		window.addEventListener("keydown", onKeyDown, { capture: true })

		return () => {
			eventTarget.removeEventListener("pointerdown", onPointerDown)
			eventTarget.removeEventListener("pointermove", onPointerMove)
			eventTarget.removeEventListener("pointerup", onPointerUp)
			eventTarget.removeEventListener("wheel", onWheel)
			window.removeEventListener("keydown", onKeyDown, { capture: true })
		}
	}, [editor])

	return (
		<div className="app">
			<div>
				<div id="canvas-event-target" className="canvas-event-target">
					<div className="canvas-area" />
					<ToolManagerOverlay />
				</div>
			</div>
			<div>
				<Toolbar />
				<LayersPanel />
				<PropertiesPanel />
			</div>
			{editingComponentId && (
				<div className="center-view">
					<ComponentCodeEditor componentId={editingComponentId} />
				</div>
			)}
		</div>
	)
}
