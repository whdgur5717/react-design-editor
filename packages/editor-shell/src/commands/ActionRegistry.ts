import type { EditorAction } from "../keybindings"

export type ActionHandler = () => void

export class ActionRegistry {
	private handlers = new Map<EditorAction, ActionHandler>()

	register(id: EditorAction, handler: ActionHandler) {
		this.handlers.set(id, handler)
	}

	unregister(id: EditorAction) {
		this.handlers.delete(id)
	}

	execute(id: EditorAction) {
		const handler = this.handlers.get(id)
		if (handler) {
			handler()
			return true
		}
		console.warn(`Action not found: ${id}`)
		return false
	}

	has(id: EditorAction) {
		return this.handlers.has(id)
	}

	getRegisteredActions() {
		return Array.from(this.handlers.keys())
	}
}
