import type { CommandHandler } from "./types"

class CommandRegistryImpl {
	private commands = new Map<string, CommandHandler>()

	/**
	 * Command 등록
	 */
	register(id: string, handler: CommandHandler): void {
		this.commands.set(id, handler)
	}

	/**
	 * Command 등록 해제
	 */
	unregister(id: string): void {
		this.commands.delete(id)
	}

	/**
	 * Command 실행
	 */
	execute(id: string): boolean {
		const handler = this.commands.get(id)
		if (handler) {
			handler()
			return true
		}
		console.warn(`Command not found: ${id}`)
		return false
	}

	/**
	 * Command 존재 여부 확인
	 */
	has(id: string): boolean {
		return this.commands.has(id)
	}

	/**
	 * 등록된 모든 Command ID 목록
	 */
	getRegisteredCommands(): string[] {
		return Array.from(this.commands.keys())
	}
}

// 싱글톤 인스턴스
export const commandRegistry = new CommandRegistryImpl()
