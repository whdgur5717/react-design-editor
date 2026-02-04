import { useEditorStore } from "../../store/editor"
import { gestureRouter } from "../GestureRouter"

// 드래그 시작 → undo 일시정지
gestureRouter.register("drag", "began", () => {
	useEditorStore.temporal.getState().pause()
})

// 드래그 완료 → 노드 이동 + undo 재개
gestureRouter.register("drag", "ended", (gesture) => {
	const { nodeId, payload } = gesture
	if (nodeId && payload.overNodeId && payload.delta) {
		useEditorStore.getState().dropNode(nodeId, payload.overNodeId, payload.delta)
	}
	useEditorStore.temporal.getState().resume()
})
