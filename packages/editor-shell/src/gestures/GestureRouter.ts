import type { CanvasGesture, GestureState, GestureType } from "@design-editor/core"

type GestureHandler<T extends GestureType> = (gesture: CanvasGesture<T>) => void

class GestureRouterImpl {
	private handlers = new Map<string, GestureHandler<GestureType>>()

	private key(type: GestureType, state: GestureState): string {
		return `${type}:${state}`
	}

	register<T extends GestureType>(type: T, state: GestureState, handler: GestureHandler<T>) {
		this.handlers.set(this.key(type, state), handler as GestureHandler<GestureType>)
	}

	handle(gesture: CanvasGesture) {
		const handler = this.handlers.get(this.key(gesture.type, gesture.state))
		handler?.(gesture)
	}
}

export const gestureRouter = new GestureRouterImpl()
