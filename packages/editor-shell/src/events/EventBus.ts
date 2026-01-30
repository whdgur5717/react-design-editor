import type { EventType } from "./types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventPayload = Record<string, any>
type EventHandler<T = EventPayload> = (payload: T) => void

interface EventBusInterface {
	dispatch<T extends EventPayload>(type: EventType, payload: T): void
	subscribe<T extends EventPayload>(type: EventType, handler: EventHandler<T>): () => void
	subscribeAll(handler: (type: EventType, payload: EventPayload) => void): () => void
	clear(): void
}

function createEventBus(): EventBusInterface {
	const handlers = new Map<EventType, Set<EventHandler>>()
	const globalHandlers = new Set<(type: EventType, payload: EventPayload) => void>()

	return {
		dispatch<T extends EventPayload>(type: EventType, payload: T) {
			// 특정 이벤트 구독자에게 전달
			const typeHandlers = handlers.get(type)
			if (typeHandlers) {
				typeHandlers.forEach((handler) => handler(payload))
			}

			// 전역 구독자에게 전달
			globalHandlers.forEach((handler) => handler(type, payload))
		},

		subscribe<T extends EventPayload>(type: EventType, handler: EventHandler<T>) {
			if (!handlers.has(type)) {
				handlers.set(type, new Set())
			}
			handlers.get(type)!.add(handler as EventHandler)

			// unsubscribe 함수 반환
			return () => {
				handlers.get(type)?.delete(handler as EventHandler)
			}
		},

		subscribeAll(handler: (type: EventType, payload: EventPayload) => void) {
			globalHandlers.add(handler)

			return () => {
				globalHandlers.delete(handler)
			}
		},

		clear() {
			handlers.clear()
			globalHandlers.clear()
		},
	}
}

// 싱글톤 인스턴스
export const eventBus = createEventBus()

export type { EventBusInterface }
