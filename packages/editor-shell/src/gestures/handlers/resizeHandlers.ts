import { useEditorStore } from "../../store/editor"
import { gestureRouter } from "../GestureRouter"

// 리사이즈 시작 → undo 일시정지
gestureRouter.register("resize", "began", () => {
	useEditorStore.temporal.getState().pause()
})

// 리사이즈 완료 → 크기 변경 + undo 재개
gestureRouter.register("resize", "ended", (gesture) => {
	const { nodeId, payload } = gesture
	if (nodeId) {
		useEditorStore.getState().resizeNode(nodeId, {
			width: payload.width,
			height: payload.height,
		})
	}
	useEditorStore.temporal.getState().resume()
})
