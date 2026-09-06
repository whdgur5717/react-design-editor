import type { EditorSnapshot } from "@open-editor-sdk/core"

import type { EditorStoreApi } from "../store/editor"

export class EditorStateApi {
	constructor(private readonly store: EditorStoreApi) {}

	getSnapshot(): EditorSnapshot {
		return this.store.getState() as EditorSnapshot
	}

	subscribe(listener: () => void) {
		return this.store.subscribe(listener)
	}

	select<T>(selector: (snapshot: EditorSnapshot) => T): T {
		return selector(this.getSnapshot())
	}
}
