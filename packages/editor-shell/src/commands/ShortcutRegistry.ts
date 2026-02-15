export type ShortcutHandler = () => void

export class ShortcutRegistryImpl {
	private handlers = new Map<string, ShortcutHandler>()

	register(id: string, handler: ShortcutHandler) {
		this.handlers.set(id, handler)
	}

	unregister(id: string) {
		this.handlers.delete(id)
	}

	execute(id: string) {
		const handler = this.handlers.get(id)
		if (handler) {
			handler()
			return true
		}
		console.warn(`Shortcut not found: ${id}`)
		return false
	}

	has(id: string) {
		return this.handlers.has(id)
	}

	getRegisteredShortcuts() {
		return Array.from(this.handlers.keys())
	}
}
