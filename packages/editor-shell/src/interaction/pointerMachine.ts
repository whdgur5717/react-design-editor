import { assign, setup } from "xstate"

import { ResizeNodeCommand } from "../commands"
import type { EditorService } from "../services/EditorService"
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

type HitTestDoneEvent = {
	type: "HIT_TEST_DONE"
	nodeId: string | null
	clientX: number
	clientY: number
	pointerId: number
	shiftKey: boolean
	metaKey: boolean
	target: HTMLElement
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
	| HitTestDoneEvent
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
}

const DRAG_THRESHOLD = 8
const DOUBLE_CLICK_MS = 300

// ── Machine factory ──

export function createPointerMachine(editorService: EditorService) {
	const { toolRegistry, shortcutRegistry, keybindingRegistry } = editorService

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
				editorService.hitTest(params.clientX, params.clientY).then((nodeId) => {
					editorService.setHoveredId(nodeId)
				})
			},

			dispatchHitTest: ({ self }, params: { event: PointerEvent_ }) => {
				const { clientX, clientY, pointerId, shiftKey, metaKey, target } = params.event
				editorService.hitTest(clientX, clientY).then((nodeId) => {
					self.send({
						type: "HIT_TEST_DONE",
						nodeId,
						clientX,
						clientY,
						pointerId,
						shiftKey,
						metaKey,
						target,
					})
				})
			},

			initDrag: ({ context }) => {
				const selection = editorService.getSelection()
				if (context.nodeId && !selection.includes(context.nodeId)) {
					editorService.setSelection([context.nodeId])
				}
			},

			updateDragPreview: ({ context, self }, params: { clientX: number; clientY: number }) => {
				if (!context.nodeId) return
				const zoom = editorService.getZoom()
				const dx = (params.clientX - context.startX) / zoom
				const dy = (params.clientY - context.startY) / zoom
				editorService.setDragPreview({ nodeId: context.nodeId, dx, dy })

				editorService.hitTest(params.clientX, params.clientY).then((nodeId) => {
					self.send({ type: "UPDATE_OVER_NODE", nodeId })
				})
			},

			commitDrag: ({ context }, params: { clientX: number; clientY: number }) => {
				if (!context.nodeId) return
				const zoom = editorService.getZoom()
				const dx = (params.clientX - context.startX) / zoom
				const dy = (params.clientY - context.startY) / zoom

				editorService.setDragPreview(null)

				toolRegistry.handleDragEnd(context.nodeId, {
					delta: { x: dx, y: dy },
					initialPosition: context.initialNodePosition,
					overNodeId: context.lastOverNodeId ?? undefined,
				})
			},

			updateResize: ({ context }, params: { clientX: number; clientY: number }) => {
				const zoom = editorService.getZoom()
				const dx = (params.clientX - context.startX) / zoom
				const dy = (params.clientY - context.startY) / zoom

				let width = context.startWidth
				let height = context.startHeight
				const handle = context.resizeHandle

				if (handle.includes("e")) width = Math.max(1, context.startWidth + dx)
				if (handle.includes("w")) width = Math.max(1, context.startWidth - dx)
				if (handle.includes("s")) height = Math.max(1, context.startHeight + dy)
				if (handle.includes("n")) height = Math.max(1, context.startHeight - dy)

				const node = editorService.findNode(context.nodeId!)
				if (node) {
					const from = { width: node.style?.width, height: node.style?.height }
					const to = { width, height }
					const receiver = editorService.getReceiver()
					editorService.executeCommand(new ResizeNodeCommand(receiver, context.nodeId!, from, to))
				}
			},

			singleClick: ({ context }) => {
				const zoom = editorService.getZoom()
				const { x: panX, y: panY } = editorService.getPan()
				const data = screenToData(context.startX, context.startY, zoom, panX, panY)
				toolRegistry.handleClick(context.nodeId, {
					x: data.x,
					y: data.y,
					shiftKey: context.shiftKey,
					metaKey: context.metaKey,
				})
			},

			doubleClick: ({ context }) => {
				const zoom = editorService.getZoom()
				const { x: panX, y: panY } = editorService.getPan()
				const data = screenToData(context.startX, context.startY, zoom, panX, panY)
				toolRegistry.handleClick(context.nodeId, {
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
				if (target.tagName === "IFRAME") return

				const payload = { key, code, shiftKey, ctrlKey, metaKey, altKey }
				const shortcutId = keybindingRegistry.match(payload)
				if (shortcutId) {
					shortcutRegistry.execute(shortcutId)
					return
				}

				toolRegistry.getActiveTool()?.onKeyDown(payload)
			},

			cancelDrag: ({ context }) => {
				if (context.nodeId) {
					editorService.setDragPreview(null)
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
		},

		on: {
			KEY_DOWN: {
				actions: { type: "handleKeyDown", params: ({ event }) => ({ event }) },
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
								const nodeId = editorService.getSelection()[0] ?? null
								const node = nodeId ? editorService.findNode(nodeId) : null

								let width = typeof node?.style?.width === "number" ? node.style.width : 0
								let height = typeof node?.style?.height === "number" ? node.style.height : 0
								if (nodeId && (width === 0 || height === 0)) {
									const rendered = editorService.getNodeRenderedRect(nodeId)
									if (rendered) {
										if (width === 0) width = rendered.width
										if (height === 0) height = rendered.height
									}
								}

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
								}
							}),
						},
						{
							target: "hitTesting",
							actions: [{ type: "dispatchHitTest", params: ({ event }) => ({ event }) }],
						},
					],
				},
			},

			// async hitTest 결과를 기다리는 중간 상태
			hitTesting: {
				on: {
					HIT_TEST_DONE: {
						target: "active.pending",
						actions: assign(({ event }) => {
							event.target.setPointerCapture(event.pointerId)
							return {
								startX: event.clientX,
								startY: event.clientY,
								nodeId: event.nodeId,
								pointerId: event.pointerId,
								shiftKey: event.shiftKey,
								metaKey: event.metaKey,
								target: event.target,
								initialNodePosition: { x: 0, y: 0 },
								startWidth: 0,
								startHeight: 0,
								resizeHandle: "",
							}
						}),
					},
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
											const node = context.nodeId ? editorService.findNode(context.nodeId) : null
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
