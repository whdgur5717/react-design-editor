import type { CanvasMethods, SyncStatePayload } from "@design-editor/core"
import type { AsyncMethodReturns } from "penpal"

/**
 * CanvasBridge — Canvas iframe과의 RPC 통신을 담당
 */
export class CanvasBridge {
	private canvasRef: AsyncMethodReturns<CanvasMethods> | null = null

	setCanvas(ref: AsyncMethodReturns<CanvasMethods> | null) {
		this.canvasRef = ref
	}

	getCanvas() {
		return this.canvasRef
	}

	async hitTest(x: number, y: number) {
		return (await this.canvasRef?.hitTest(x, y)) ?? null
	}

	async getNodeRect(nodeId: string) {
		return (await this.canvasRef?.getNodeRect(nodeId)) ?? null
	}

	syncState(state: SyncStatePayload) {
		this.canvasRef?.syncState(state)
	}
}
