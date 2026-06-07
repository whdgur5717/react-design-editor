import { type AnyActor, createActor } from "xstate"

import { createPointerMachine, type PointerMachineDeps } from "./pointerMachine"

export class InteractionController {
	private pointerActor: AnyActor | null = null

	constructor(private readonly deps: PointerMachineDeps) {}

	start() {
		if (this.pointerActor) return
		this.pointerActor = createActor(createPointerMachine(this.deps))
		this.pointerActor.start()
	}

	dispose() {
		this.pointerActor?.stop()
		this.pointerActor = null
	}

	sendPointerDown(e: {
		clientX: number
		clientY: number
		pointerId: number
		shiftKey: boolean
		metaKey: boolean
		target: HTMLElement
	}) {
		this.pointerActor?.send({
			type: "POINTER_DOWN",
			...e,
		})
	}

	sendPointerMove(e: { clientX: number; clientY: number }) {
		this.pointerActor?.send({
			type: "POINTER_MOVE",
			...e,
		})
	}

	sendPointerUp(e: { clientX: number; clientY: number; shiftKey: boolean; metaKey: boolean }) {
		this.pointerActor?.send({
			type: "POINTER_UP",
			...e,
		})
	}

	sendKeyDown(e: {
		key: string
		code: string
		shiftKey: boolean
		ctrlKey: boolean
		metaKey: boolean
		altKey: boolean
		target: HTMLElement
	}) {
		this.pointerActor?.send({
			type: "KEY_DOWN",
			...e,
		})
	}

	sendWheel(e: {
		deltaX: number
		deltaY: number
		clientX: number
		clientY: number
		ctrlKey: boolean
		metaKey: boolean
	}) {
		this.pointerActor?.send({
			type: "WHEEL",
			...e,
		})
	}
}
