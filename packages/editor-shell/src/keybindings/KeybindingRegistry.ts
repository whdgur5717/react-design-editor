import { useEditorStore } from "../store/editor"
import { defaultKeybindings } from "./defaults"
import type { Keybinding, KeyEventLike } from "./types"

class KeybindingRegistryImpl {
	private bindings: Keybinding[] = [...defaultKeybindings]

	/**
	 * Keybinding 추가
	 */
	register(binding: Keybinding): void {
		this.bindings.push(binding)
	}

	/**
	 * Keybinding 제거
	 */
	unregister(command: string): void {
		this.bindings = this.bindings.filter((b) => b.command !== command)
	}

	/**
	 * 키보드 이벤트에 매칭되는 Command ID 반환
	 */
	match(e: KeyEventLike): string | null {
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

		const state = useEditorStore.getState()
		switch (when) {
			case "hasSelection":
				return state.selection.length > 0
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

// 싱글톤 인스턴스
export const keybindingRegistry = new KeybindingRegistryImpl()
