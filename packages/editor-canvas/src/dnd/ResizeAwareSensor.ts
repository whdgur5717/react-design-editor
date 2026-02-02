import { PointerSensor } from "@dnd-kit/core"

/**
 * 리사이즈 핸들에서 시작된 드래그를 무시하는 커스텀 센서
 * re-resizable과 dnd-kit 충돌 방지
 */
export class ResizeAwareSensor extends PointerSensor {
	static override activators = [
		{
			eventName: "onPointerDown" as const,
			handler({ nativeEvent }: { nativeEvent: PointerEvent }) {
				const target = nativeEvent.target as HTMLElement

				// 리사이즈 핸들에서 시작된 이벤트는 dnd-kit에서 무시하고 re-resizable이 처리
				// → re-resizable이 처리
				if (target.closest(".resize-handle")) {
					return false
				}

				return true
			},
		},
	]
}
