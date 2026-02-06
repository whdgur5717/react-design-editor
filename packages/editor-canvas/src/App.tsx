import "./App.css"
import "@design-editor/components"

import type { ComponentDefinition, EditorTool, PageNode, ShellMethods, SyncStatePayload } from "@design-editor/core"
import { DndContext, type DragEndEvent, pointerWithin, useDroppable, useSensor, useSensors } from "@dnd-kit/core"
import { type AsyncMethodReturns, connectToParent } from "penpal"
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react"

import { ResizeAwareSensor } from "./dnd"
import { CanvasRenderer } from "./renderer/CanvasRenderer"
import { getTargetNodeId, isResizeHandle } from "./utils/dom"
import { toCanvasKeyEvent } from "./utils/events"
import { adjustDeltaForZoom } from "./utils/math"

interface CreationDragState {
	startX: number
	startY: number
}

export function App() {
	const [currentPage, setCurrentPage] = useState<PageNode | null>(null)
	const [_components, setComponents] = useState<ComponentDefinition[]>([])
	const [selectedIds, setSelectedIds] = useState<string[]>([])
	const [zoom, setZoom] = useState(1)
	const [activeTool, setActiveTool] = useState<EditorTool>("select")
	const [cursor, setCursor] = useState<CSSProperties["cursor"]>("default")
	const parentMethodsRef = useRef<AsyncMethodReturns<ShellMethods> | null>(null)

	const [creationDragState, setCreationDragState] = useState<CreationDragState | null>(null)

	// Shell 응답 전 깜빡임 방지용 로컬 위치 오버라이드
	const [positionOverrides, setPositionOverrides] = useState<Map<string, { x: number; y: number }>>(new Map())

	const sensors = useSensors(
		useSensor(ResizeAwareSensor, {
			activationConstraint: { distance: 8 },
		}),
	)

	const { setNodeRef: setCanvasDropRef } = useDroppable({
		id: currentPage?.id ?? "canvas",
	})

	useEffect(() => {
		const connection = connectToParent<ShellMethods>({
			methods: {
				syncState(state: SyncStatePayload) {
					const page = state.document.children.find((p) => p.id === state.currentPageId)
					setCurrentPage(page ?? null)
					setComponents(state.components)
					setZoom(state.zoom)
					setSelectedIds(state.selection)
					setActiveTool(state.activeTool)
					setCursor(state.cursor)
					setPositionOverrides(new Map())
				},
			},
		})

		connection.promise.then((parent) => {
			parentMethodsRef.current = parent
		})

		return () => {
			connection.destroy()
		}
	}, [])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			parentMethodsRef.current?.onCanvasKeyEvent(toCanvasKeyEvent(e, "keydown"))
		}

		const handleKeyUp = (e: KeyboardEvent) => {
			parentMethodsRef.current?.onCanvasKeyEvent(toCanvasKeyEvent(e, "keyup"))
		}

		window.addEventListener("keydown", handleKeyDown, { capture: true })
		window.addEventListener("keyup", handleKeyUp, { capture: true })

		return () => {
			window.removeEventListener("keydown", handleKeyDown, { capture: true })
			window.removeEventListener("keyup", handleKeyUp, { capture: true })
		}
	}, [])

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over, delta } = event

			if (!active || !currentPage) return

			const activeNodeId = String(active.id)
			const overNodeId = over ? String(over.id) : currentPage.id

			const adjustedDelta = adjustDeltaForZoom(delta, zoom)

			// 깜빡임 방지: Shell 응답 전에 로컬에서 즉시 새 위치 적용
			const { left = 0, top = 0 } = (active.data.current ?? {}) as { left?: number; top?: number }
			setPositionOverrides((prev) => {
				const next = new Map(prev)
				next.set(activeNodeId, {
					x: left + adjustedDelta.x,
					y: top + adjustedDelta.y,
				})
				return next
			})

			parentMethodsRef.current?.onCanvasDndEnd({
				type: "dnd:end",
				activeNodeId,
				overNodeId,
				delta: adjustedDelta,
			})
		},
		[currentPage, zoom],
	)

	const handleCanvasMouseDown = useCallback(
		(e: React.MouseEvent) => {
			const target = e.target as HTMLElement
			if (isResizeHandle(target)) {
				return
			}

			const targetNodeId = getTargetNodeId(target)

			if (activeTool === "select") {
				parentMethodsRef.current?.onCanvasPointerEvent({
					type: "mousedown",
					x: e.clientX,
					y: e.clientY,
					clientX: e.clientX,
					clientY: e.clientY,
					targetNodeId,
					shiftKey: e.shiftKey,
					ctrlKey: e.ctrlKey,
					metaKey: e.metaKey,
					altKey: e.altKey,
				})
				return
			}

			if (activeTool === "frame" || activeTool === "text") {
				parentMethodsRef.current?.onCanvasPointerEvent({
					type: "mousedown",
					x: e.clientX,
					y: e.clientY,
					clientX: e.clientX,
					clientY: e.clientY,
					targetNodeId,
					shiftKey: e.shiftKey,
					ctrlKey: e.ctrlKey,
					metaKey: e.metaKey,
					altKey: e.altKey,
				})
				setCreationDragState({
					startX: e.clientX,
					startY: e.clientY,
				})
			}
		},
		[activeTool],
	)

	const handleCanvasMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (creationDragState) {
				const dx = e.clientX - creationDragState.startX
				const dy = e.clientY - creationDragState.startY
				parentMethodsRef.current?.onCanvasPointerEvent({
					type: "mousemove",
					x: e.clientX,
					y: e.clientY,
					clientX: e.clientX,
					clientY: e.clientY,
					targetNodeId: "__creation__",
					shiftKey: e.shiftKey,
					ctrlKey: e.ctrlKey,
					metaKey: e.metaKey,
					altKey: e.altKey,
					nodeId: "__creation__",
					deltaX: dx,
					deltaY: dy,
				})
				setCreationDragState({
					startX: e.clientX,
					startY: e.clientY,
				})
			} else {
				parentMethodsRef.current?.onCanvasPointerEvent({
					type: "mousemove",
					x: e.clientX,
					y: e.clientY,
					clientX: e.clientX,
					clientY: e.clientY,
					targetNodeId: getTargetNodeId(e.target as HTMLElement),
					shiftKey: e.shiftKey,
					ctrlKey: e.ctrlKey,
					metaKey: e.metaKey,
					altKey: e.altKey,
				})
			}
		},
		[creationDragState],
	)

	const handleCanvasMouseUp = useCallback(
		(e: React.MouseEvent) => {
			if (creationDragState) {
				parentMethodsRef.current?.onCanvasPointerEvent({
					type: "dragend",
					x: e.clientX,
					y: e.clientY,
					clientX: e.clientX,
					clientY: e.clientY,
					targetNodeId: "__creation__",
					shiftKey: e.shiftKey,
					ctrlKey: e.ctrlKey,
					metaKey: e.metaKey,
					altKey: e.altKey,
					nodeId: "__creation__",
				})
				setCreationDragState(null)
			} else {
				parentMethodsRef.current?.onCanvasPointerEvent({
					type: "mouseup",
					x: e.clientX,
					y: e.clientY,
					clientX: e.clientX,
					clientY: e.clientY,
					targetNodeId: getTargetNodeId(e.target as HTMLElement),
					shiftKey: e.shiftKey,
					ctrlKey: e.ctrlKey,
					metaKey: e.metaKey,
					altKey: e.altKey,
				})
			}
		},
		[creationDragState],
	)

	const handleResizeStart = useCallback(() => {
		parentMethodsRef.current?.onCanvasPointerEvent({
			type: "mousedown",
			x: 0,
			y: 0,
			clientX: 0,
			clientY: 0,
			targetNodeId: null,
			shiftKey: false,
			ctrlKey: false,
			metaKey: false,
			altKey: false,
			isResizeStart: true,
		})
	}, [])

	const handleResizeEnd = useCallback((nodeId: string, width: number, height: number) => {
		parentMethodsRef.current?.onCanvasPointerEvent({
			type: "mouseup",
			x: 0,
			y: 0,
			clientX: 0,
			clientY: 0,
			targetNodeId: nodeId,
			shiftKey: false,
			ctrlKey: false,
			metaKey: false,
			altKey: false,
			isResizeEnd: true,
			width,
			height,
		})
	}, [])

	if (!currentPage) {
		return <div className="loading">Loading...</div>
	}

	return (
		<DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
			<div
				ref={setCanvasDropRef}
				className="canvas-app"
				style={{ transform: `scale(${zoom})`, cursor }}
				onMouseDown={handleCanvasMouseDown}
				onMouseMove={handleCanvasMouseMove}
				onMouseUp={handleCanvasMouseUp}
			>
				<CanvasRenderer
					page={currentPage}
					selectedIds={selectedIds}
					positionOverrides={positionOverrides}
					onResizeStart={handleResizeStart}
					onResizeEnd={handleResizeEnd}
				/>
			</div>
		</DndContext>
	)
}
