import { clamp } from "es-toolkit"
import { assign, setup } from "xstate"

import type { ActionRegistry } from "../commands/ActionRegistry"
import type { KeybindingRegistry } from "../keybindings"
import type { DocumentService } from "../services/DocumentService"
import type { GeometryService } from "../services/GeometryService"
import type { SelectionService } from "../services/SelectionService"
import type { ViewportService } from "../services/ViewportService"
import type { ToolRegistry } from "../tools/ToolRegistry"
import { screenToData } from "../utils/nodePosition"

// ── Event types ──

type PointerEvent_ = {
	type: "POINTER_DOWN"
	clientX: number
	clientY: number
	pointerId: number
	shiftKey: boolean
	metaKey: boolean
	target: HTMLElement
}

type PointerMoveEvent = {
	type: "POINTER_MOVE"
	clientX: number
	clientY: number
}

type PointerUpEvent = {
	type: "POINTER_UP"
	clientX: number
	clientY: number
	shiftKey: boolean
	metaKey: boolean
}

type KeyDownEvent = {
	type: "KEY_DOWN"
	key: string
	code: string
	shiftKey: boolean
	ctrlKey: boolean
	metaKey: boolean
	altKey: boolean
	target: HTMLElement
}

type WheelEvent_ = {
	type: "WHEEL"
	deltaX: number
	deltaY: number
	clientX: number
	clientY: number
	ctrlKey: boolean
	metaKey: boolean
}

type UpdateOverNodeEvent = {
	type: "UPDATE_OVER_NODE"
	nodeId: string | null
}

type PointerMachineEvent =
	| PointerEvent_
	| PointerMoveEvent
	| PointerUpEvent
	| KeyDownEvent
	| WheelEvent_
	| UpdateOverNodeEvent

// ── Context ──

interface PointerContext {
	startX: number
	startY: number
	nodeId: string | null
	pointerId: number
	shiftKey: boolean
	metaKey: boolean
	target: HTMLElement | null
	// drag
	initialNodePosition: { x: number; y: number }
	lastOverNodeId: string | null
	// resize
	startWidth: number
	startHeight: number
	resizeHandle: string
	resizeSessionId: string
}

const DRAG_THRESHOLD = 8
const DOUBLE_CLICK_MS = 300

export interface PointerMachineDeps {
	document: Pick<DocumentService, "findNode" | "resizeNode">
	selection: Pick<SelectionService, "getSelection" | "setSelection" | "setHoveredId">
	viewport: Pick<ViewportService, "getZoom" | "getPan" | "setZoom" | "setPan">
	geometry: Pick<GeometryService, "hitTestNodeId" | "getNodeRenderedRect">
	dragPreview: {
		setDragPreview(preview: { nodeId: string; dx: number; dy: number } | null): void
	}
	tools: Pick<ToolRegistry, "handleDragEnd" | "handleClick" | "getActiveTool">
	actions: Pick<ActionRegistry, "execute">
	keybindings: Pick<KeybindingRegistry, "match">
}

// ── Machine factory ──

export function createPointerMachine(deps: PointerMachineDeps) {
	return setup({
		types: {
			context: {} as PointerContext,
			events: {} as PointerMachineEvent,
		},

		actions: {
			capturePointer: ({ context }) => {
				context.target?.setPointerCapture(context.pointerId)
			},

			updateHover: (_, params: { clientX: number; clientY: number }) => {
				deps.selection.setHoveredId(deps.geometry.hitTestNodeId(params.clientX, params.clientY))
			},

			initDrag: ({ context }) => {
				const selection = deps.selection.getSelection()
				if (context.nodeId && !selection.includes(context.nodeId)) {
					deps.selection.setSelection([context.nodeId])
				}
			},

			updateDragPreview: ({ context, self }, params: { clientX: number; clientY: number }) => {
				if (!context.nodeId) return
				const zoom = deps.viewport.getZoom()
				const dx = (params.clientX - context.startX) / zoom
				const dy = (params.clientY - context.startY) / zoom
				deps.dragPreview.setDragPreview({ nodeId: context.nodeId, dx, dy })

				self.send({ type: "UPDATE_OVER_NODE", nodeId: deps.geometry.hitTestNodeId(params.clientX, params.clientY) })
			},

			commitDrag: ({ context }, params: { clientX: number; clientY: number }) => {
				if (!context.nodeId) return
				const zoom = deps.viewport.getZoom()
				const dx = (params.clientX - context.startX) / zoom
				const dy = (params.clientY - context.startY) / zoom

				deps.dragPreview.setDragPreview(null)

				deps.tools.handleDragEnd(context.nodeId, {
					delta: { x: dx, y: dy },
					initialPosition: context.initialNodePosition,
					overNodeId: context.lastOverNodeId ?? undefined,
				})
			},

			updateResize: ({ context }, params: { clientX: number; clientY: number }) => {
				if (!context.nodeId) return

				const zoom = deps.viewport.getZoom()
				const dx = (params.clientX - context.startX) / zoom
				const dy = (params.clientY - context.startY) / zoom

				let width = context.startWidth
				let height = context.startHeight
				const handle = context.resizeHandle

				if (handle.includes("e")) width = Math.max(1, context.startWidth + dx)
				if (handle.includes("w")) width = Math.max(1, context.startWidth - dx)
				if (handle.includes("s")) height = Math.max(1, context.startHeight + dy)
				if (handle.includes("n")) height = Math.max(1, context.startHeight - dy)

				const node = deps.document.findNode(context.nodeId)
				if (!node) return

				const from = { width: context.startWidth, height: context.startHeight }
				const to = { width, height }
				const mergeKey = `resize:${context.nodeId}:${context.resizeSessionId}`
				deps.document.resizeNode(context.nodeId, from, to, mergeKey)
			},

			singleClick: ({ context }) => {
				const zoom = deps.viewport.getZoom()
				const { x: panX, y: panY } = deps.viewport.getPan()
				const data = screenToData(context.startX, context.startY, zoom, panX, panY)
				deps.tools.handleClick(context.nodeId, {
					x: data.x,
					y: data.y,
					shiftKey: context.shiftKey,
					metaKey: context.metaKey,
				})
			},

			doubleClick: ({ context }) => {
				const zoom = deps.viewport.getZoom()
				const { x: panX, y: panY } = deps.viewport.getPan()
				const data = screenToData(context.startX, context.startY, zoom, panX, panY)
				deps.tools.handleClick(context.nodeId, {
					x: data.x,
					y: data.y,
					shiftKey: context.shiftKey,
					metaKey: context.metaKey,
				})
			},

			handleKeyDown: (_, params: { event: KeyDownEvent }) => {
				const { target, key, code, shiftKey, ctrlKey, metaKey, altKey } = params.event

				if (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
					return
				}
				if (shouldPreserveNativeClipboard(target, key, metaKey, ctrlKey)) return

				const payload = { key, code, shiftKey, ctrlKey, metaKey, altKey }
				const actionId = deps.keybindings.match(payload)
				if (actionId) {
					deps.actions.execute(actionId)
					return
				}

				deps.tools.getActiveTool()?.onKeyDown(payload)
			},

			handleWheel: (_, params: { event: WheelEvent_ }) => {
				const zoom = deps.viewport.getZoom()
				const { x: panX, y: panY } = deps.viewport.getPan()

				if (params.event.ctrlKey || params.event.metaKey) {
					// 줌: 마우스 포인터 기준
					const newZoom = clamp(zoom * (1 - params.event.deltaY * 0.01), 0.1, 4)
					const ratio = newZoom / zoom
					const newPanX = params.event.clientX - (params.event.clientX - panX) * ratio
					const newPanY = params.event.clientY - (params.event.clientY - panY) * ratio
					deps.viewport.setZoom(newZoom)
					deps.viewport.setPan(newPanX, newPanY)
				} else {
					// 팬
					deps.viewport.setPan(panX - params.event.deltaX, panY - params.event.deltaY)
				}
			},

			cancelDrag: ({ context }) => {
				if (context.nodeId) {
					deps.dragPreview.setDragPreview(null)
				}
			},
		},

		guards: {
			isResizeHandle: (_, params: { target: HTMLElement }) => {
				return !!params.target.closest("[data-resize-handle]")
			},

			hasNode: ({ context }) => context.nodeId !== null,

			exceedsThreshold: ({ context }, params: { clientX: number; clientY: number }) => {
				const dx = params.clientX - context.startX
				const dy = params.clientY - context.startY
				return Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD
			},
		},

		delays: {
			DOUBLE_CLICK_TIMEOUT: DOUBLE_CLICK_MS,
		},
	}).createMachine({
		id: "pointer",
		initial: "idle",
		context: {
			startX: 0,
			startY: 0,
			nodeId: null,
			pointerId: 0,
			shiftKey: false,
			metaKey: false,
			target: null,
			initialNodePosition: { x: 0, y: 0 },
			lastOverNodeId: null,
			startWidth: 0,
			startHeight: 0,
			resizeHandle: "",
			resizeSessionId: "",
		},

		on: {
			KEY_DOWN: {
				actions: { type: "handleKeyDown", params: ({ event }) => ({ event }) },
			},
			WHEEL: {
				actions: { type: "handleWheel", params: ({ event }) => ({ event }) },
			},
		},

		states: {
			idle: {
				on: {
					POINTER_MOVE: {
						actions: {
							type: "updateHover",
							params: ({ event }) => ({ clientX: event.clientX, clientY: event.clientY }),
						},
					},
					POINTER_DOWN: [
						{
							guard: {
								type: "isResizeHandle",
								params: ({ event }) => ({ target: event.target }),
							},
							target: "active.resizing",
							actions: assign(({ event }) => {
								const target = event.target
								const resizeHandle = target.closest("[data-resize-handle]") as HTMLElement
								const nodeId = deps.selection.getSelection()[0] ?? null
								const rendered = nodeId ? deps.geometry.getNodeRenderedRect(nodeId) : null
								const width = rendered?.width ?? 0
								const height = rendered?.height ?? 0

								return {
									startX: event.clientX,
									startY: event.clientY,
									nodeId,
									pointerId: event.pointerId,
									shiftKey: event.shiftKey,
									metaKey: event.metaKey,
									target,
									startWidth: width,
									startHeight: height,
									resizeHandle: resizeHandle?.dataset.resizeHandle ?? "",
									initialNodePosition: { x: 0, y: 0 },
									resizeSessionId: crypto.randomUUID(),
								}
							}),
						},
						{
							target: "active.pending",
							actions: assign(({ event }) => {
								event.target.setPointerCapture(event.pointerId)
								return {
									startX: event.clientX,
									startY: event.clientY,
									nodeId: deps.geometry.hitTestNodeId(event.clientX, event.clientY),
									pointerId: event.pointerId,
									shiftKey: event.shiftKey,
									metaKey: event.metaKey,
									target: event.target,
									initialNodePosition: { x: 0, y: 0 },
									lastOverNodeId: null,
									startWidth: 0,
									startHeight: 0,
									resizeHandle: "",
									resizeSessionId: "",
								}
							}),
						},
					],
				},
			},

			active: {
				initial: "pending",
				states: {
					pending: {
						on: {
							POINTER_MOVE: [
								{
									guard: {
										type: "exceedsThreshold",
										params: ({ event }) => ({ clientX: event.clientX, clientY: event.clientY }),
									},
									target: "dragging",
									actions: [
										assign(({ context }) => {
											const node = context.nodeId ? deps.document.findNode(context.nodeId) : null
											const initialX = node?.x ?? 0
											const initialY = node?.y ?? 0
											return { initialNodePosition: { x: initialX, y: initialY } }
										}),
										"initDrag",
									],
								},
							],
							POINTER_UP: {
								target: "#pointer.clicking",
								actions: "singleClick",
							},
						},
					},

					dragging: {
						on: {
							POINTER_MOVE: {
								actions: {
									type: "updateDragPreview",
									params: ({ event }) => ({ clientX: event.clientX, clientY: event.clientY }),
								},
							},
							UPDATE_OVER_NODE: {
								actions: assign(({ event }) => ({ lastOverNodeId: event.nodeId })),
							},
							POINTER_UP: {
								target: "#pointer.idle",
								actions: {
									type: "commitDrag",
									params: ({ event }) => ({ clientX: event.clientX, clientY: event.clientY }),
								},
							},
						},
					},

					resizing: {
						entry: "capturePointer",
						on: {
							POINTER_MOVE: {
								actions: {
									type: "updateResize",
									params: ({ event }) => ({ clientX: event.clientX, clientY: event.clientY }),
								},
							},
							POINTER_UP: {
								target: "#pointer.idle",
							},
						},
					},
				},
			},

			clicking: {
				initial: "awaitingSecond",
				states: {
					awaitingSecond: {
						after: {
							DOUBLE_CLICK_TIMEOUT: {
								target: "#pointer.idle",
							},
						},
						on: {
							POINTER_DOWN: {
								target: "#pointer.idle",
								actions: "doubleClick",
							},
						},
					},
				},
			},
		},
	})
}
function shouldPreserveNativeClipboard(target: HTMLElement, key: string, metaKey: boolean, ctrlKey: boolean) {
	const isClipboardShortcut = (metaKey || ctrlKey) && ["c", "x", "v"].includes(key.toLowerCase())
	if (!isClipboardShortcut) return false

	const selection = window.getSelection()?.toString().trim()
	if (!selection) return false

	return !target.closest("[data-design-editor-event-target]")
}
