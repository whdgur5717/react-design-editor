import "./App.css"
import "@design-editor/components"

import type {
	CanvasGesture,
	ComponentDefinition,
	EditorTool,
	GestureType,
	PageNode,
	ShellMethods,
	SyncStatePayload,
} from "@design-editor/core"
import {
	DndContext,
	type DragEndEvent,
	type DragStartEvent,
	pointerWithin,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core"
import { type AsyncMethodReturns, connectToParent } from "penpal"
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react"

import { ResizeAwareSensor } from "./dnd"
import { CanvasRenderer } from "./renderer/CanvasRenderer"

export function App() {
	const [currentPage, setCurrentPage] = useState<PageNode | null>(null)
	const [components, setComponents] = useState<ComponentDefinition[]>([])
	const [selectedIds, setSelectedIds] = useState<string[]>([])
	const [zoom, setZoom] = useState(1)
	const [, setActiveTool] = useState<EditorTool>("select")
	const [cursor, setCursor] = useState<CSSProperties["cursor"]>("default")
	const parentMethodsRef = useRef<AsyncMethodReturns<ShellMethods> | null>(null)

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

	// 통합 Gesture 전송 함수
	const sendGesture = useCallback(<T extends GestureType>(gesture: CanvasGesture<T>) => {
		parentMethodsRef.current?.onGesture(gesture)
	}, [])

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

	// 키보드 이벤트
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			sendGesture({
				type: "key",
				state: "began",
				nodeId: null,
				payload: {
					key: e.key,
					code: e.code,
					shiftKey: e.shiftKey,
					ctrlKey: e.ctrlKey,
					metaKey: e.metaKey,
					altKey: e.altKey,
				},
			})
		}

		const handleKeyUp = (e: KeyboardEvent) => {
			sendGesture({
				type: "key",
				state: "ended",
				nodeId: null,
				payload: {
					key: e.key,
					code: e.code,
					shiftKey: e.shiftKey,
					ctrlKey: e.ctrlKey,
					metaKey: e.metaKey,
					altKey: e.altKey,
				},
			})
		}

		window.addEventListener("keydown", handleKeyDown, { capture: true })
		window.addEventListener("keyup", handleKeyUp, { capture: true })

		return () => {
			window.removeEventListener("keydown", handleKeyDown, { capture: true })
			window.removeEventListener("keyup", handleKeyUp, { capture: true })
		}
	}, [sendGesture])

	const getTargetNodeId = useCallback((target: EventTarget): string | null => {
		let el = target as HTMLElement
		while (el && el !== document.body) {
			if (el.dataset.nodeId) {
				return el.dataset.nodeId
			}
			el = el.parentElement as HTMLElement
		}
		return null
	}, [])

	const isResizeHandle = useCallback((target: EventTarget): boolean => {
		const el = target as HTMLElement
		return el.classList.contains("resize-handle") || el.closest(".resize-handle") !== null
	}, [])

	// dnd-kit 드래그 시작
	const handleDragStart = useCallback(
		(_event: DragStartEvent) => {
			sendGesture({
				type: "drag",
				state: "began",
				nodeId: null,
				payload: { delta: { x: 0, y: 0 } },
			})
		},
		[sendGesture],
	)

	// dnd-kit 드래그 종료
	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over, delta } = event

			if (!active || !currentPage) return

			const activeNodeId = String(active.id)
			const overNodeId = over ? String(over.id) : currentPage.id

			// zoom 보정
			const adjustedDelta = {
				x: delta.x / zoom,
				y: delta.y / zoom,
			}

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

			sendGesture({
				type: "drag",
				state: "ended",
				nodeId: activeNodeId,
				payload: {
					delta: adjustedDelta,
					overNodeId,
				},
			})
		},
		[currentPage, zoom, sendGesture],
	)

	// 클릭 이벤트
	const handleCanvasMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (isResizeHandle(e.target)) {
				return
			}

			const targetNodeId = getTargetNodeId(e.target)

			sendGesture({
				type: "click",
				state: "ended",
				nodeId: targetNodeId,
				payload: {
					x: e.clientX,
					y: e.clientY,
					shiftKey: e.shiftKey,
					metaKey: e.metaKey,
				},
			})
		},
		[getTargetNodeId, isResizeHandle, sendGesture],
	)

	// 리사이즈 시작
	const handleResizeStart = useCallback(() => {
		sendGesture({
			type: "resize",
			state: "began",
			nodeId: null,
			payload: { width: 0, height: 0 },
		})
	}, [sendGesture])

	// 리사이즈 종료
	const handleResizeEnd = useCallback(
		(nodeId: string, width: number, height: number) => {
			sendGesture({
				type: "resize",
				state: "ended",
				nodeId,
				payload: { width, height },
			})
		},
		[sendGesture],
	)

	if (!currentPage) {
		return <div className="loading">Loading...</div>
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={pointerWithin}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<div
				ref={setCanvasDropRef}
				className="canvas-app"
				style={{ transform: `scale(${zoom})`, cursor }}
				onMouseDown={handleCanvasMouseDown}
			>
				<CanvasRenderer
					page={currentPage}
					components={components}
					selectedIds={selectedIds}
					positionOverrides={positionOverrides}
					onResizeStart={handleResizeStart}
					onResizeEnd={handleResizeEnd}
				/>
			</div>
		</DndContext>
	)
}
