import type { EditorAction } from "./defaults"
import type { Keybinding, KeyEventLike } from "./types"

export class KeybindingRegistry {
	private bindings: Keybinding[] = []

	constructor(private readonly getSelection: () => string[]) {}

	/**
	 * Keybinding 추가
	 */
	register(binding: Keybinding): void {
		this.bindings.push(binding)
	}

	/**
	 * Keybinding 제거
	 */
	unregister(command: EditorAction): void {
		this.bindings = this.bindings.filter((b) => b.command !== command)
	}

	/**
	 * 키보드 이벤트에 매칭되는 액션 ID 반환
	 */
	match(e: KeyEventLike): EditorAction | null {
		const binding = this.bindings.find(
			(b) =>
				b.key.toLowerCase() === e.key.toLowerCase() &&
				!!b.modifiers.meta === (e.metaKey || e.ctrlKey) &&
				!!b.modifiers.shift === e.shiftKey &&
				!!b.modifiers.alt === e.altKey &&
				this.checkCondition(b.when),
		)
		return binding?.command ?? null
	}

	/**
	 * 조건 확인
	 */
	private checkCondition(when?: string): boolean {
		if (!when) return true

		switch (when) {
			case "hasSelection":
				return this.getSelection().length > 0
			default:
				return true
		}
	}

	/**
	 * 모든 Keybinding 목록
	 */
	getBindings(): Keybinding[] {
		return [...this.bindings]
	}
}
