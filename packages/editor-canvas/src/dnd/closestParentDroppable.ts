import type { CollisionDetection } from "@dnd-kit/core"

/**
 * 포인터 위치에 겹치는 droppable 중 드래그 노드와 가장 가까운 부모를 반환.
 * 드래그 중인 노드 자신은 제외.
 */
export const closestParentDroppable: CollisionDetection = ({ active, droppableContainers, pointerCoordinates }) => {
	if (!pointerCoordinates) return []

	// 1. 포인터가 rect 안에 있는 droppable만 필터 (자기 자신 제외)
	const candidates = droppableContainers.filter((container) => {
		if (container.id === active.id) return false
		const node = container.node.current
		if (!node) return false

		const rect = node.getBoundingClientRect()
		return (
			pointerCoordinates.x >= rect.left &&
			pointerCoordinates.x <= rect.right &&
			pointerCoordinates.y >= rect.top &&
			pointerCoordinates.y <= rect.bottom
		)
	})

	if (candidates.length === 0) return []

	// 2. 드래그 노드와 가장 가까운 부모 droppable 찾기
	const closest = candidates.reduce((a, b) => {
		const aNode = a.node.current!
		const bNode = b.node.current!
		// a가 b를 포함하면 b가 더 가까운 부모
		return aNode.contains(bNode) ? b : a
	})

	return [{ id: closest.id, data: { droppableContainer: closest } }]
}
