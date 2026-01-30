/**
 * Command 핸들러 타입
 */
export type CommandHandler = () => void

/**
 * Command 정의
 */
export interface Command {
	id: string
	handler: CommandHandler
}
