import "./App.css"
import "@design-editor/components"

import type { ComponentDefinition, EditorTool, PageNode, ShellMethods, SyncStatePayload } from "@design-editor/core"
import { type AsyncMethodReturns, connectToParent } from "penpal"
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react"

import { CanvasRenderer } from "./renderer/CanvasRenderer"

interface DragState {
	nodeId: string
	startX: number
	startY: number
}

export function App() {
	const [currentPage, setCurrentPage] = useState<PageNode | null>(null)
	const [components, setComponents] = useState<ComponentDefinition[]>([])
	const [selectedIds, setSelectedIds] = useState<string[]>([])
	const [zoom, setZoom] = useState(1)
	const [activeTool, setActiveTool] = useState<EditorTool>("select")
	const [cursor, setCursor] = useState<CSSProperties["cursor"]>("default")
	const parentMethodsRef = useRef<AsyncMethodReturns<ShellMethods> | null>(null)

	// 드래그 추적용 (시작점 기준 delta 계산)
	const [localDragState, setLocalDragState] = useState<DragState | null>(null)

	console.log(localDragState)

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

	// Canvas 키보드 이벤트 캡처 → Shell로 전달
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			parentMethodsRef.current?.onCanvasKeyEvent({
				type: "keydown",
				key: e.key,
				code: e.code,
				shiftKey: e.shiftKey,
				ctrlKey: e.ctrlKey,
				metaKey: e.metaKey,
				altKey: e.altKey,
			})
		}

		const handleKeyUp = (e: KeyboardEvent) => {
			parentMethodsRef.current?.onCanvasKeyEvent({
				type: "keyup",
				key: e.key,
				code: e.code,
				shiftKey: e.shiftKey,
				ctrlKey: e.ctrlKey,
				metaKey: e.metaKey,
				altKey: e.altKey,
			})
		}

		window.addEventListener("keydown", handleKeyDown, { capture: true })
		window.addEventListener("keyup", handleKeyUp, { capture: true })

		return () => {
			window.removeEventListener("keydown", handleKeyDown, { capture: true })
			window.removeEventListener("keyup", handleKeyUp, { capture: true })
		}
	}, [])

	// 클릭된 노드 ID 찾기 (data-node-id 속성으로)
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

	// resize handle 클릭 여부 확인
	const isResizeHandle = useCallback((target: EventTarget): boolean => {
		const el = target as HTMLElement
		return el.classList.contains("resize-handle") || el.closest(".resize-handle") !== null
	}, [])

	// Canvas 마우스 이벤트 핸들러
	const handleCanvasMouseDown = useCallback(
		(e: React.MouseEvent) => {
			// resize handle 클릭이면 드래그 시작 안 함
			if (isResizeHandle(e.target)) {
				return
			}

			const targetNodeId = getTargetNodeId(e.target)

			// Shell에 mousedown 이벤트 전달
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

			// 드래그 상태 시작
			if (activeTool === "select" && targetNodeId) {
				// select tool: 노드 클릭 시 드래그
				setLocalDragState({
					nodeId: targetNodeId,
					startX: e.clientX,
					startY: e.clientY,
				})
			} else if (activeTool === "frame" || activeTool === "text") {
				// 생성 도구: 빈 공간 드래그
				setLocalDragState({
					nodeId: "__creation__",
					startX: e.clientX,
					startY: e.clientY,
				})
			}
		},
		[getTargetNodeId, activeTool, isResizeHandle],
	)

	const handleCanvasMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (localDragState) {
				// 드래그 중: Shell에 이벤트 전달 → store 업데이트 → syncState로 리렌더
				const dx = e.clientX - localDragState.startX
				const dy = e.clientY - localDragState.startY
				parentMethodsRef.current?.onCanvasPointerEvent({
					type: "mousemove",
					x: e.clientX,
					y: e.clientY,
					clientX: e.clientX,
					clientY: e.clientY,
					targetNodeId: localDragState.nodeId,
					shiftKey: e.shiftKey,
					ctrlKey: e.ctrlKey,
					metaKey: e.metaKey,
					altKey: e.altKey,
					nodeId: localDragState.nodeId,
					deltaX: dx,
					deltaY: dy,
				})
				// 다음 이동 계산용 시작점 갱신
				setLocalDragState({
					...localDragState,
					startX: e.clientX,
					startY: e.clientY,
				})
			} else {
				// hover 처리
				const targetNodeId = getTargetNodeId(e.target)
				parentMethodsRef.current?.onCanvasPointerEvent({
					type: "mousemove",
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
			}
		},
		[localDragState, getTargetNodeId],
	)

	const handleCanvasMouseUp = useCallback(
		(e: React.MouseEvent) => {
			if (localDragState) {
				// 드래그 완료
				parentMethodsRef.current?.onCanvasPointerEvent({
					type: "dragend",
					x: e.clientX,
					y: e.clientY,
					clientX: e.clientX,
					clientY: e.clientY,
					targetNodeId: localDragState.nodeId,
					shiftKey: e.shiftKey,
					ctrlKey: e.ctrlKey,
					metaKey: e.metaKey,
					altKey: e.altKey,
					nodeId: localDragState.nodeId,
				})
				setLocalDragState(null)
			} else {
				parentMethodsRef.current?.onCanvasPointerEvent({
					type: "mouseup",
					x: e.clientX,
					y: e.clientY,
					clientX: e.clientX,
					clientY: e.clientY,
					targetNodeId: getTargetNodeId(e.target),
					shiftKey: e.shiftKey,
					ctrlKey: e.ctrlKey,
					metaKey: e.metaKey,
					altKey: e.altKey,
				})
			}
		},
		[localDragState, getTargetNodeId],
	)

	// 리사이즈 이벤트 핸들러 (re-resizable용)
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
		<div
			className="canvas-app"
			style={{ transform: `scale(${zoom})`, cursor }}
			onMouseDown={handleCanvasMouseDown}
			onMouseMove={handleCanvasMouseMove}
			onMouseUp={handleCanvasMouseUp}
		>
			<CanvasRenderer
				page={currentPage}
				components={components}
				selectedIds={selectedIds}
				onResizeStart={handleResizeStart}
				onResizeEnd={handleResizeEnd}
			/>
		</div>
	)
}
