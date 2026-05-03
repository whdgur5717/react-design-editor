import { debounce } from "es-toolkit"
import { useEffect, useRef } from "react"

import { useEditor } from "../services/EditorContext"
import { ToolManagerOverlay } from "./Overlay"

export function CanvasInteractionSurface() {
	const editor = useEditor()
	const eventTargetRef = useRef<HTMLDivElement>(null)
	const overlayRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const eventTarget = eventTargetRef.current
		if (!eventTarget) return

		const toCanvasPoint = (e: { clientX: number; clientY: number }) => {
			const rect = eventTarget.getBoundingClientRect()
			return {
				clientX: e.clientX - rect.left,
				clientY: e.clientY - rect.top,
			}
		}

		const showOverlay = debounce(() => {
			if (overlayRef.current) overlayRef.current.style.visibility = "visible"
		}, 100)

		const onPointerDown = (e: PointerEvent) => {
			e.preventDefault()
			const point = toCanvasPoint(e)
			editor.sendPointerDown({
				clientX: point.clientX,
				clientY: point.clientY,
				pointerId: e.pointerId,
				shiftKey: e.shiftKey,
				metaKey: e.metaKey,
				target: e.target as HTMLElement,
			})
		}

		const onPointerMove = (e: PointerEvent) => {
			const point = toCanvasPoint(e)
			editor.sendPointerMove({
				clientX: point.clientX,
				clientY: point.clientY,
			})
		}

		const onPointerUp = (e: PointerEvent) => {
			const point = toCanvasPoint(e)
			editor.sendPointerUp({
				clientX: point.clientX,
				clientY: point.clientY,
				shiftKey: e.shiftKey,
				metaKey: e.metaKey,
			})
		}

		const onWheel = (e: WheelEvent) => {
			e.preventDefault()
			if (overlayRef.current) overlayRef.current.style.visibility = "hidden"
			showOverlay()
			const point = toCanvasPoint(e)
			editor.sendWheel({
				deltaX: e.deltaX,
				deltaY: e.deltaY,
				clientX: point.clientX,
				clientY: point.clientY,
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
			showOverlay.cancel()
		}
	}, [editor])

	return (
		<div className="canvas-interaction-surface">
			<div
				ref={eventTargetRef}
				className="canvas-event-target"
				data-design-editor-event-target=""
				data-testid="design-editor-event-target"
			>
				<div className="canvas-area" />
				<div ref={overlayRef}>
					<ToolManagerOverlay />
				</div>
			</div>
		</div>
	)
}
